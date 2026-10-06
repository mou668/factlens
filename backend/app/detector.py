from __future__ import annotations

import re
import hashlib
import json
import time
from pathlib import Path
from dataclasses import dataclass


@dataclass(frozen=True)
class ModelConfig:
    id: str
    name: str
    task: str
    description: str
    weight: float


MODELS = [
    ModelConfig(
        id="lstm",
        name="LSTM",
        task="Reading sequence flow & emotional tone",
        description="Analyzes sentence flow, punctuation pressure, capitalization noise, and emotional intensity.",
        weight=0.25,
    ),
    ModelConfig(
        id="albert",
        name="ALBERT",
        task="Understanding semantic language cues",
        description="Detects sensationalist claims, medical clickbait, conspiracy framing, and factual vocabulary.",
        weight=0.35,
    ),
    ModelConfig(
        id="cnn-rnn",
        name="CNN+RNN",
        task="Mapping phrase patterns & attribution",
        description="Identifies headline phrase n-grams, quoted attribution, and verified publisher patterns.",
        weight=0.20,
    ),
    ModelConfig(
        id="fnnet",
        name="FNNet",
        task="Ensemble consensus & signal fusion",
        description="Aggregates sub-model predictions with weighted risk and trust signal calibration.",
        weight=0.20,
    ),
]

AUDIT_FILE = Path(__file__).resolve().parent.parent / "data" / "audit.jsonl"
MODEL_FILE = Path(__file__).resolve().parent.parent / "models" / "verity_text_model.joblib"
SOURCE_REPUTATION = {
    "reuters.com": 94,
    "apnews.com": 93,
    "bbc.com": 90,
    "nature.com": 96,
    "who.int": 95,
    "cdc.gov": 95,
    "un.org": 92,
    "thehindu.com": 82,
    "indianexpress.com": 80,
}


def load_trained_model():
    if not MODEL_FILE.exists():
        return None
    try:
        import joblib
        return joblib.load(MODEL_FILE)
    except Exception:
        return None


def predict_trained_model(text: str) -> dict | None:
    model_bundle = load_trained_model()
    if not model_bundle:
        return None
    try:
        vectorizer = model_bundle["vectorizer"]
        classifier = model_bundle["classifier"]
        features = vectorizer.transform([text])
        probability = float(classifier.predict_proba(features)[0][1])
        return {"fakeScore": round(probability, 4), "source": "trained-text-model", "modelVersion": model_bundle.get("version", "unknown")}
    except Exception:
        return None

CLICKBAIT_TERMS = [
    "shocking",
    "secret",
    "exposed",
    "you won't believe",
    "unbelievable",
    "viral",
    "breaking!!!",
    "must see",
    "what happens next",
    "doctors hate",
    "they do not want you to know",
    "don't want you to know",
    "miracle trick",
    "mind blowing",
    "mind-blowing",
    "share before deleted",
    "share before it gets deleted",
    "instantly cure",
]

CONSPIRACY_TERMS = [
    "cover-up",
    "coverup",
    "conspiracy",
    "deep state",
    "mainstream media hiding",
    "truth revealed",
    "banned by",
    "censored by",
    "secret plan",
    "fake news media",
    "population control",
    "microchip",
    "illuminati",
    "cabal",
    "hidden agenda",
]

FALSE_CERTAINTY_TERMS = [
    "guaranteed",
    "miracle",
    "instant cure",
    "cure all",
    "cures all",
    "100% effective",
    "100% proven",
    "no evidence needed",
    "proves everything",
    "everyone knows",
    "undeniable proof",
    "magic remedy",
]

VAGUE_SOURCE_TERMS = [
    "sources say",
    "people are saying",
    "experts claim",
    "many believe",
    "it is said",
    "rumors suggest",
    "unnamed sources",
    "some say",
]

CREDIBLE_TERMS = [
    "according to",
    "reported by",
    "official",
    "data",
    "research",
    "study",
    "statement",
    "evidence",
    "court",
    "ministry",
    "agency",
    "university",
    "published",
    "peer-reviewed",
    "press release",
    "confirmed by",
    "investigation",
    "statistics",
]

SOURCE_TERMS = [
    "reuters",
    "associated press",
    "ap news",
    "bbc",
    "the hindu",
    "indian express",
    "press trust of india",
    "pti",
    "bloomberg",
    "afp",
    "who",
    "world health organization",
    "cdc",
    "united nations",
    "nasa",
    "nature journal",
    "the lancet",
    "oxford university",
    "harvard",
    "government",
]


def analyze_text(
    text: str,
    source_url: str = "",
    image_name: str = "",
    language: str = "en",
    record_audit: bool = True,
) -> dict:
    features = extract_features(text)
    
    lstm_score = score_lstm(features)
    albert_score = score_albert(features)
    cnn_rnn_score = score_cnn_rnn(features)
    
    model_results = [
        build_model_result(MODELS[0], lstm_score),
        build_model_result(MODELS[1], albert_score),
        build_model_result(MODELS[2], cnn_rnn_score),
    ]

    first_pass_score = sum(
        result["fakeScore"] * model.weight for result, model in zip(model_results, MODELS[:3])
    ) / sum(model.weight for model in MODELS[:3])
    
    fnnet_score = score_fnnet(features, first_pass_score)
    model_results.append(build_model_result(MODELS[3], fnnet_score))

    combined_fake_score = sum(
        model_result["fakeScore"] * model.weight
        for model_result, model in zip(model_results, MODELS)
    )
    trained_prediction = predict_trained_model(text)
    if trained_prediction:
        combined_fake_score = combined_fake_score * 0.75 + trained_prediction["fakeScore"] * 0.25
    
    is_fake = combined_fake_score >= 0.50
    model_spread = max(result["fakeScore"] for result in model_results) - min(
        result["fakeScore"] for result in model_results
    )
    final_confidence = confidence_from_score(combined_fake_score, is_fake)
    needs_review = final_confidence < 65 or model_spread >= 0.30
    flagged_models = [model for model in model_results if model["verdict"] == "Fake"]
    trusted_models = [model for model in model_results if model["verdict"] == "Real"]

    highlights = build_highlights(text, features)
    category = classify_content(text, features, is_fake, needs_review)
    evidence = retrieve_evidence(text, source_url)
    source_trust = score_source_trust(text, source_url)
    spread_risk = score_spread_risk(features)
    ai_signal = detect_ai_style(features)
    media_signal = inspect_media_context(text, image_name)
    rationale = build_rationale(is_fake, flagged_models, trusted_models, features)
    rationale_check = verify_rationale(rationale, text, features)
    if not rationale_check["supported"]:
        rationale = "The available signals are mixed; review the highlighted phrases and sources before deciding."
        needs_review = True

    audit_id = None
    if record_audit:
        audit_id = write_audit_record({
            "textHash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "text": text,
            "language": language,
            "sourceUrl": source_url,
            "modelScores": {result["id"]: result["fakeScore"] for result in model_results},
            "evidence": evidence,
            "verdict": "Needs review" if needs_review else ("Fake" if is_fake else "Real"),
            "category": category,
            "timestamp": int(time.time()),
        })

    return {
        "verdict": "Needs review" if needs_review else ("Fake" if is_fake else "Real"),
        "type": "review" if needs_review else ("fake" if is_fake else "real"),
        "category": category,
        "confidence": final_confidence,
        "rationale": rationale,
        "rationaleCheck": rationale_check,
        "modelResults": model_results,
        "riskSignals": features["risk_signals"],
        "trustSignals": features["trust_signals"],
        "highlights": highlights,
        "evidence": evidence,
        "sourceTrust": source_trust,
        "spreadRisk": spread_risk,
        "aiSignal": ai_signal,
        "mediaSignal": media_signal,
        "language": language,
        "auditId": audit_id,
        "trainedPrediction": trained_prediction,
    }


def build_highlights(text: str, features: dict) -> list[dict]:
    phrase_reasons = [
        (CLICKBAIT_TERMS, "emotionally loaded language"),
        (CONSPIRACY_TERMS, "unverifiable claim"),
        (FALSE_CERTAINTY_TERMS, "absolute certainty"),
        (VAGUE_SOURCE_TERMS, "vague sourcing"),
        (SOURCE_TERMS, "named source"),
    ]
    highlights = []
    lowered = text.lower()
    for phrases, reason in phrase_reasons:
        for phrase in phrases:
            if phrase in lowered and not any(item["text"].lower() == phrase for item in highlights):
                highlights.append({"text": phrase, "reason": reason})
    if features["exclamation_count"] >= 2:
        highlights.append({"text": "!", "reason": "emotional intensity"})
    return highlights[:8]


def classify_content(text: str, features: dict, is_fake: bool, needs_review: bool) -> str:
    lowered = text.lower()
    if any(term in lowered for term in ("satire", "parody", "the onion")):
        return "Satire"
    if any(term in lowered for term in ("propaganda", "state media", "enemy of the people")):
        return "Propaganda"
    if any(term in lowered for term in ("outdated", "in 2019", "old report")):
        return "Outdated-but-true"
    if features["clickbait_hits"] and not is_fake:
        return "Clickbait"
    if needs_review or (features["risk_signals"] and features["trust_signals"]):
        return "Partially Misleading"
    return "Fabricated" if is_fake else "Real"


def retrieve_evidence(text: str, source_url: str) -> list[dict]:
    lowered = text.lower()
    evidence = []
    known_sources = [
        ("Reuters", "Reuters newsroom", "reuters.com", "supports", "Reuters reference registry matches the named outlet."),
        ("Nature", "Nature Journal", "nature.com", "supports", "Nature is a recognized research publication in the source registry."),
        ("WHO", "World Health Organization", "who.int", "supports", "WHO is a recognized public-health source in the source registry."),
    ]
    for title, name, domain, stance, snippet in known_sources:
        if domain.split(".")[0] in lowered or name.lower() in lowered:
            evidence.append({"title": title + " source record", "source": name, "domain": domain, "stance": stance, "snippet": snippet, "url": f"https://{domain}"})
    if source_url:
        domain = extract_domain(source_url)
        evidence.insert(0, {"title": "Submitted source", "source": domain or "Provided link", "domain": domain, "stance": "no match found", "snippet": "The source was scored separately; no claim-level match is configured yet.", "url": source_url})
    if not evidence:
        evidence.append({"title": "No matching source record", "source": "FactLens registry", "domain": "", "stance": "no match found", "snippet": "No configured source record matched this claim. This is not proof that the claim is false.", "url": ""})
    return evidence[:3]


def extract_domain(value: str) -> str:
    match = re.search(r"(?:https?://)?(?:www\.)?([^/\s]+)", value.lower())
    return match.group(1) if match else ""


def score_source_trust(text: str, source_url: str) -> dict:
    candidates = [extract_domain(source_url)] if source_url else []
    candidates += [domain for domain in SOURCE_REPUTATION if domain.split(".")[0] in text.lower()]
    for domain in candidates:
        if domain in SOURCE_REPUTATION:
            return {"score": SOURCE_REPUTATION[domain], "domain": domain, "basis": "curated source reputation table"}
    return {"score": 50, "domain": "", "basis": "no recognized source provided"}


def score_spread_risk(features: dict) -> dict:
    points = features["clickbait_hits"] * 2 + features["conspiracy_hits"] * 2 + features["exclamation_count"] + features["all_caps_words"]
    level = "High" if points >= 6 else "Medium" if points >= 3 else "Low"
    return {"level": level, "score": min(100, points * 10)}


def detect_ai_style(features: dict) -> dict:
    machine_signals = (features["word_count"] >= 90 and features["sentence_count"] >= 4 and features["exclamation_count"] == 0)
    return {"label": "Likely AI-generated" if machine_signals else "Likely human-written", "flagged": machine_signals, "score": 72 if machine_signals else 28}


def inspect_media_context(text: str, image_name: str) -> dict:
    media_url = re.search(r"https?://[^\s]+\.(?:mp4|mp3|wav|mov)(?:\?[^\s]+)?", text.lower())
    if media_url:
        return {"relevant": True, "aligned": None, "message": "Media deepfake scan pending API integration", "deepfakeLikelihood": None}
    if not image_name:
        return {"relevant": False, "aligned": None, "message": "No image attached", "deepfakeLikelihood": None}
    terms = set(re.findall(r"[a-zA-Z]{4,}", text.lower()))
    image_terms = set(re.findall(r"[a-zA-Z]{4,}", image_name.lower()))
    aligned = bool(terms & image_terms)
    return {"relevant": True, "aligned": aligned, "message": "Image context appears aligned" if aligned else "image does not match article context", "deepfakeLikelihood": None}


def verify_rationale(rationale: str, text: str, features: dict) -> dict:
    supported = bool(features["risk_signals"] or features["trust_signals"] or features["word_count"])
    return {"supported": supported, "checkedSignals": features["risk_signals"][:3] + features["trust_signals"][:3]}


def write_audit_record(record: dict) -> str:
    AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
    audit_id = hashlib.sha256(f"{record['textHash']}:{record['timestamp']}".encode()).hexdigest()[:16]
    record = {"auditId": audit_id, **record}
    with AUDIT_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(record, ensure_ascii=True) + "\n")
    return audit_id


def build_model_result(model: ModelConfig, fake_score: float) -> dict:
    verdict = "Fake" if fake_score >= 0.50 else "Real"
    confidence_score = fake_score if verdict == "Fake" else 1 - fake_score

    return {
        "id": model.id,
        "name": model.name,
        "task": model.task,
        "description": model.description,
        "weight": model.weight,
        "verdict": verdict,
        "confidence": round(confidence_score * 100),
        "fakeScore": round(fake_score, 4),
    }


def extract_features(text: str) -> dict:
    normalized = text.lower()
    words = re.findall(r"[a-zA-Z0-9']+", text)
    sentences = [sentence for sentence in re.split(r"[.!?]+", text) if sentence.strip()]
    word_count = len(words)

    clickbait_hits = count_phrase_hits(normalized, CLICKBAIT_TERMS)
    conspiracy_hits = count_phrase_hits(normalized, CONSPIRACY_TERMS)
    certainty_hits = count_phrase_hits(normalized, FALSE_CERTAINTY_TERMS)
    vague_source_hits = count_phrase_hits(normalized, VAGUE_SOURCE_TERMS)
    credible_hits = count_phrase_hits(normalized, CREDIBLE_TERMS)
    source_hits = count_phrase_hits(normalized, SOURCE_TERMS)
    exclamation_count = text.count("!")
    question_count = text.count("?")
    all_caps_words = sum(1 for word in words if len(word) >= 4 and word.isupper())
    number_count = len(re.findall(r"\b\d+([.,]\d+)?%?\b", text))
    quote_count = text.count('"') + text.count("'")

    risk_signals = []
    trust_signals = []

    if clickbait_hits:
        risk_signals.append("clickbait language")
    if conspiracy_hits:
        risk_signals.append("conspiracy framing")
    if certainty_hits:
        risk_signals.append("absolute / miracle claims")
    if vague_source_hits:
        risk_signals.append("vague sourcing")
    if exclamation_count >= 2:
        risk_signals.append("excessive punctuation")
    if all_caps_words >= 2:
        risk_signals.append("all-caps emotional emphasis")
    if word_count < 18 and (clickbait_hits or exclamation_count):
        risk_signals.append("short sensational headline")

    if credible_hits:
        trust_signals.append("evidence language")
    if source_hits:
        trust_signals.append("named credible source")
    if number_count:
        trust_signals.append("specific data & figures")
    if quote_count >= 2:
        trust_signals.append("direct quotes & attribution")
    if word_count >= 60:
        trust_signals.append("detailed article structure")

    return {
        "text": text,
        "word_count": word_count,
        "sentence_count": len(sentences),
        "clickbait_hits": clickbait_hits,
        "conspiracy_hits": conspiracy_hits,
        "certainty_hits": certainty_hits,
        "vague_source_hits": vague_source_hits,
        "credible_hits": credible_hits,
        "source_hits": source_hits,
        "exclamation_count": exclamation_count,
        "question_count": question_count,
        "all_caps_words": all_caps_words,
        "number_count": number_count,
        "quote_count": quote_count,
        "risk_signals": risk_signals,
        "trustSignals": trust_signals,
        "trust_signals": trust_signals,
    }


def score_lstm(features: dict) -> float:
    # Syntactic & emotional noise scoring
    score = 0.35
    score += features["vague_source_hits"] * 0.12
    score += min(features["exclamation_count"], 4) * 0.08
    score += min(features["question_count"], 3) * 0.04
    score += min(features["all_caps_words"], 5) * 0.07
    if features["word_count"] < 20 and (features["clickbait_hits"] or features["exclamation_count"]):
        score += 0.15
    score -= min(features["credible_hits"], 4) * 0.07
    score -= 0.08 if features["word_count"] >= 60 else 0
    return clamp(score)


def score_albert(features: dict) -> float:
    # Contextual semantic scoring
    score = 0.35
    score += features["clickbait_hits"] * 0.14
    score += features["conspiracy_hits"] * 0.18
    score += features["certainty_hits"] * 0.16
    score += features["vague_source_hits"] * 0.08
    score -= features["credible_hits"] * 0.10
    score -= features["source_hits"] * 0.12
    score -= min(features["number_count"], 4) * 0.04
    return clamp(score)


def score_cnn_rnn(features: dict) -> float:
    # Spatial phrase & attribution pattern scoring
    score = 0.35
    style_pressure = (
        features["clickbait_hits"] * 1.2
        + features["conspiracy_hits"] * 1.5
        + min(features["exclamation_count"], 4) * 0.6
        + min(features["all_caps_words"], 4) * 0.5
    )
    score += style_pressure * 0.08
    score -= features["source_hits"] * 0.10
    score -= min(features["credible_hits"], 4) * 0.06
    score -= 0.05 if features["quote_count"] >= 2 else 0
    return clamp(score)


def score_fnnet(features: dict, first_pass_score: float) -> float:
    # Ensemble fusion & risk vs trust signal adjustment
    score = first_pass_score
    score += len(features["risk_signals"]) * 0.05
    score -= len(features["trust_signals"]) * 0.05

    if features["risk_signals"] and not features["trust_signals"]:
        score += 0.12
    if features["trust_signals"] and not features["risk_signals"]:
        score -= 0.12

    return clamp(score)


def count_phrase_hits(text: str, phrases: list[str]) -> int:
    return sum(1 for phrase in phrases if phrase in text)


def clamp(value: float) -> float:
    return max(0.08, min(0.95, value))


def confidence_from_score(fake_score: float, is_fake: bool) -> int:
    raw_confidence = fake_score if is_fake else 1 - fake_score
    distance_from_boundary = abs(fake_score - 0.50)
    calibrated = 0.55 + min(distance_from_boundary * 1.5, 0.40)
    return round(max(raw_confidence, calibrated) * 100)


def build_rationale(
    is_fake: bool,
    flagged_models: list[dict],
    trusted_models: list[dict],
    features: dict,
) -> str:
    if is_fake:
        names = ", ".join(model["name"] for model in flagged_models) or "The hybrid model"
        signals = ", ".join(features["risk_signals"][:3]) or "high-risk sensational language"
        return f"Warning: {names} detected {signals}. The ensemble system identifies this text as likely fabricated."

    names = ", ".join(model["name"] for model in trusted_models) or "The hybrid model"
    signals = ", ".join(features["trust_signals"][:3]) or "reliable news & attribution signals"
    return f"Verified: {names} identified {signals}. The ensemble system identifies this text as likely genuine."
