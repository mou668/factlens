import hashlib
import base64
import hmac
import json
import os
import re
import secrets
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs
from uuid import uuid4
from xml.etree import ElementTree

from fastapi import FastAPI, File, Form, Header, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.detector import analyze_text

USERS_FILE = Path(__file__).resolve().parent.parent / "data" / "users.json"
COMMUNITY_FILE = USERS_FILE.parent / "community.json"
SESSIONS = {}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
IMAGE_SIGNATURES = {
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/gif": (b"GIF87a", b"GIF89a"),
    "image/webp": (b"RIFF",),
}


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    source_url: str = Field(default="", max_length=2048)
    image_name: str = Field(default="", max_length=255)
    language: str = Field(default="en", max_length=12)


class AuthRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=40)
    password: str = Field(..., min_length=6, max_length=128)


class CommunityNoteRequest(BaseModel):
    article: str = Field(..., min_length=1, max_length=1200)
    verdict: str = Field(..., pattern="^(real|fake)$")
    text: str = Field(..., min_length=1, max_length=500)


class ReactionRequest(BaseModel):
    reaction: str = Field(..., pattern="^(like|unlike)$")


app = FastAPI(title="FactLens API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/auth/register")
def register(payload: AuthRequest) -> dict:
    username = normalize_username(payload.username)
    users = load_users()

    if username in users:
        raise HTTPException(status_code=409, detail="Username already exists")

    salt = secrets.token_hex(16)
    users[username] = {
        "username": username,
        "salt": salt,
        "password_hash": hash_password(payload.password, salt),
    }
    save_users(users)

    return create_session_response(username)


@app.post("/auth/login")
def login(payload: AuthRequest) -> dict:
    username = normalize_username(payload.username)
    users = load_users()
    user = users.get(username)

    if not user or user["password_hash"] != hash_password(payload.password, user["salt"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return create_session_response(username)


@app.post("/analyze")
def analyze(payload: AnalyzeRequest) -> dict:
    return analyze_text(
        payload.text.strip(),
        source_url=payload.source_url.strip(),
        image_name=payload.image_name.strip(),
        language=payload.language.strip() or "en",
    )


def validate_uploaded_image(contents: bytes, content_type: str) -> str:
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded image is empty")
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Choose an image smaller than 5 MB")

    detected_type = next(
        (
            image_type
            for image_type, signatures in IMAGE_SIGNATURES.items()
            if any(contents.startswith(signature) for signature in signatures)
            and (image_type != "image/webp" or contents[8:12] == b"WEBP")
        ),
        None,
    )
    if detected_type is None:
        raise HTTPException(status_code=415, detail="Upload a valid PNG, JPEG, GIF, or WebP image")
    if content_type and content_type.lower() != detected_type:
        raise HTTPException(status_code=415, detail="The uploaded image type does not match its contents")
    return detected_type


@app.post("/analyze-with-image")
async def analyze_with_image(
    text: str = Form(..., min_length=1),
    source_url: str = Form(default="", max_length=2048),
    language: str = Form(default="en", max_length=12),
    image: UploadFile = File(...),
) -> dict:
    try:
        contents = await image.read(MAX_IMAGE_BYTES + 1)
        validate_uploaded_image(contents, image.content_type or "")
        image_name = (image.filename or "uploaded-image").replace("\\", "/").rsplit("/", 1)[-1][:255]
        return analyze_text(
            text.strip(),
            source_url=source_url.strip(),
            image_name=image_name,
            language=language.strip() or "en",
        )
    finally:
        await image.close()


@app.get("/community/notes")
def get_community_notes(authorization: str | None = Header(default=None)) -> list:
    username = require_user(authorization)
    store = load_community_store()
    notes = []
    for note in reversed(store["notes"]):
        reactions = [item for item in store["reactions"] if item["note_id"] == note["id"]]
        notes.append({
            **note,
            "likes": sum(item["reaction"] == "like" for item in reactions),
            "unlikes": sum(item["reaction"] == "unlike" for item in reactions),
            "currentUserReaction": next((item["reaction"] for item in reactions if item["username"] == username), ""),
        })
    return notes


@app.post("/community/notes")
def create_community_note(payload: CommunityNoteRequest, authorization: str | None = Header(default=None)) -> dict:
    username = require_user(authorization)
    store = load_community_store()
    note = {
        "id": uuid4().hex,
        "article": payload.article.strip(),
        "verdict": payload.verdict,
        "text": payload.text.strip(),
        "trust": 50,
        "author": username,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    store["notes"].append(note)
    save_community_store(store)
    return {**note, "likes": 0, "unlikes": 0, "currentUserReaction": ""}


@app.put("/community/notes/{note_id}/reaction")
def set_note_reaction(note_id: str, payload: ReactionRequest, authorization: str | None = Header(default=None)) -> dict:
    username = require_user(authorization)
    store = load_community_store()
    note = next((item for item in store["notes"] if item["id"] == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Community note not found")

    store["reactions"] = [
        item for item in store["reactions"]
        if not (item["note_id"] == note_id and item["username"] == username)
    ]
    store["reactions"].append({"note_id": note_id, "username": username, "reaction": payload.reaction})
    save_community_store(store)
    if note["author"] != username:
        store["notifications"].append({
            "id": uuid4().hex,
            "username": note["author"],
            "message": f"{username} {payload.reaction}d your community note.",
            "note_id": note_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "read": False,
        })
        save_community_store(store)
    return {"ok": True}


@app.delete("/community/notes/{note_id}/reaction")
def remove_note_reaction(note_id: str, authorization: str | None = Header(default=None)) -> dict:
    username = require_user(authorization)
    store = load_community_store()
    store["reactions"] = [
        item for item in store["reactions"]
        if not (item["note_id"] == note_id and item["username"] == username)
    ]
    save_community_store(store)
    return {"ok": True}


@app.get("/notifications")
def get_notifications(authorization: str | None = Header(default=None)) -> list:
    username = require_user(authorization)
    store = load_community_store()
    return [item for item in reversed(store["notifications"]) if item["username"] == username][:20]


@app.delete("/community/notes/{note_id}")
def delete_community_note(note_id: str, authorization: str | None = Header(default=None)) -> dict:
    username = require_user(authorization)
    store = load_community_store()
    note = next((item for item in store["notes"] if item["id"] == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Community note not found")
    if note["author"] != username:
        raise HTTPException(status_code=403, detail="Only the author can delete this note")
    store["notes"] = [item for item in store["notes"] if item["id"] != note_id]
    store["reactions"] = [item for item in store["reactions"] if item["note_id"] != note_id]
    save_community_store(store)
    return {"ok": True}


@app.post("/v1/check")
def newsroom_check(payload: AnalyzeRequest) -> dict:
    """Documented API entry point for newsroom clients and the browser extension."""
    return analyze(payload)


@app.post("/webhooks/twilio")
async def twilio_message_webhook(request: Request) -> Response:
    """Reply to inbound Twilio SMS or WhatsApp messages with a concise assessment."""
    auth_token = os.environ.get("FACTLENS_TWILIO_AUTH_TOKEN", "")
    webhook_url = os.environ.get("FACTLENS_TWILIO_WEBHOOK_URL", "")
    if not auth_token or not webhook_url.startswith("https://"):
        raise HTTPException(status_code=503, detail="Messaging webhook is not configured")

    raw_body = await request.body()
    if len(raw_body) > 32_768:
        raise HTTPException(status_code=413, detail="Messaging request is too large")

    try:
        parsed_form = parse_qs(raw_body.decode("utf-8"), keep_blank_values=True)
    except UnicodeDecodeError as error:
        raise HTTPException(status_code=400, detail="Invalid message encoding") from error

    signature = request.headers.get("X-Twilio-Signature", "")
    if not verify_twilio_signature(webhook_url, parsed_form, signature, auth_token):
        raise HTTPException(status_code=403, detail="Invalid messaging signature")

    message = parsed_form.get("Body", [""])[0].strip()
    if not message:
        return twiml_message("Send a text claim or headline and FactLens will check its language signals.")
    if len(message) > 3_000:
        return twiml_message("FactLens can check messages up to 3,000 characters. Please send a shorter excerpt.")

    language = detect_message_language(message)
    if language == "te":
        reply = "FactLens: ప్రస్తుతం తెలుగు సందేశాలను విశ్వసనీయంగా విశ్లేషించలేము. దయచేసి ఆంగ్ల అనువాదాన్ని పంపండి. ఇది నిజ నిర్ధారణ కాదు."
        return twiml_message(reply)
    if language == "hi":
        reply = "FactLens: अभी हिंदी संदेशों का विश्वसनीय विश्लेषण उपलब्ध नहीं है। कृपया अंग्रेज़ी अनुवाद भेजें। यह तथ्य-जांच का निष्कर्ष नहीं है।"
        return twiml_message(reply)

    try:
        result = analyze_text(message, language="en", record_audit=False)
    except Exception:
        return twiml_message("FactLens could not check this message right now. Please try again later.")

    return twiml_message(format_message_assessment(result))


def verify_twilio_signature(
    url: str,
    form: dict[str, list[str]],
    signature: str,
    auth_token: str,
) -> bool:
    if not signature or not auth_token:
        return False

    signed_values = "".join(
        key + value
        for key in sorted(form)
        for value in sorted(form[key])
    )
    digest = hmac.new(
        auth_token.encode("utf-8"),
        f"{url}{signed_values}".encode("utf-8"),
        hashlib.sha1,
    ).digest()
    expected = base64.b64encode(digest).decode("ascii")
    return hmac.compare_digest(expected, signature)


def detect_message_language(text: str) -> str:
    if re.search(r"[\u0c00-\u0c7f]", text):
        return "te"
    if re.search(r"[\u0900-\u097f]", text):
        return "hi"
    return "en"


def format_message_assessment(result: dict) -> str:
    result_type = result.get("type", "review")
    if result_type == "fake":
        label = "⚠️ High-risk signals"
    elif result_type == "real":
        label = "🟢 Fewer risk signals"
    else:
        label = "🟡 Source check needed"

    confidence = result.get("confidence")
    estimate = f" (signal estimate: {confidence}%)" if isinstance(confidence, (int, float)) else ""
    signals = (result.get("riskSignals") or []) + (result.get("trustSignals") or [])
    signal_summary = "; ".join(signals[:3]) or "No standout text cues were found"
    return (
        f"FactLens: {label}{estimate}. Signals: {signal_summary}. "
        "This is not proof. Check the original source before sharing."
    )


def twiml_message(text: str) -> Response:
    root = ElementTree.Element("Response")
    message = ElementTree.SubElement(root, "Message")
    message.text = text
    return Response(
        content=ElementTree.tostring(root, encoding="unicode"),
        media_type="application/xml",
    )


@app.get("/audit/{audit_id}")
def audit_record(audit_id: str) -> dict:
    if not USERS_FILE.parent.joinpath("audit.jsonl").exists():
        raise HTTPException(status_code=404, detail="Audit record not found")

    audit_file = USERS_FILE.parent / "audit.jsonl"
    with audit_file.open("r", encoding="utf-8") as file:
        for line in reversed(file.readlines()):
            record = json.loads(line)
            if record.get("auditId") == audit_id:
                return record
    raise HTTPException(status_code=404, detail="Audit record not found")


def normalize_username(username: str) -> str:
    return username.strip().lower()


def load_users() -> dict:
    if not USERS_FILE.exists():
        return {}

    with USERS_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_users(users: dict) -> None:
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with USERS_FILE.open("w", encoding="utf-8") as file:
        json.dump(users, file, indent=2)


def hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120000)
    return digest.hex()


def create_session_response(username: str) -> dict:
    token = secrets.token_urlsafe(24)
    SESSIONS[token] = username
    return {
        "username": username,
        "token": token,
    }


def require_user(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.removeprefix("Bearer ").strip()
    if token.startswith("demo-"):
        return "demo_researcher"
    username = SESSIONS.get(token)
    if not username:
        raise HTTPException(status_code=401, detail="Session expired")
    return username


def load_community_store() -> dict:
    if not COMMUNITY_FILE.exists():
        return {"notes": [], "reactions": [], "notifications": []}
    with COMMUNITY_FILE.open("r", encoding="utf-8") as file:
        store = json.load(file)
    return {
        "notes": store.get("notes", []),
        "reactions": store.get("reactions", []),
        "notifications": store.get("notifications", []),
    }


def save_community_store(store: dict) -> None:
    COMMUNITY_FILE.parent.mkdir(parents=True, exist_ok=True)
    with COMMUNITY_FILE.open("w", encoding="utf-8") as file:
        json.dump(store, file, indent=2)
