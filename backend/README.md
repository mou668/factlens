# FactLens Backend

FastAPI backend for the FactLens claim signal review workflow.

The current detector is a deterministic placeholder that mirrors the four planned model outputs:

- LSTM
- ALBERT
- CNN+RNN
- FNNet

Replace `app/detector.py` with the real trained model loading and inference code when the model artifacts are ready.
Register/login is available through simple local JSON storage for prototype use.

## Run

```powershell
cd backend
.\start_backend.ps1
```

The API runs at `http://127.0.0.1:8000`.

## Endpoints

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /analyze`
- `POST /analyze-with-image` (multipart form with `text`, optional `source_url` and `language`, and an `image` file)
- `POST /v1/check` (same pipeline for newsroom and extension clients)
- `POST /webhooks/twilio` (inbound Twilio SMS and WhatsApp messages)
- `GET /audit/{auditId}`

Example request:

```json
{
  "text": "Paste a headline or article here",
  "source_url": "",
  "image_name": "",
  "language": "en"
}
```

The response includes the four model scores plus category, uncertainty state, explainability highlights, evidence records, source trust, spread risk, AI-text signal, media signal, and an `auditId`.
Image uploads accept PNG, JPEG, GIF, or WebP files up to 5 MB. The upload is validated and used to indicate that image evidence was attached; visual image analysis is not available in this prototype.

## WhatsApp and SMS

The Twilio webhook accepts inbound SMS or WhatsApp messages and returns a short TwiML reply. To enable it, deploy the backend on a public HTTPS URL, configure a Twilio Messaging/WhatsApp sender, and set these backend environment variables:

```powershell
$env:FACTLENS_TWILIO_AUTH_TOKEN = "<Twilio auth token>"
$env:FACTLENS_TWILIO_WEBHOOK_URL = "https://your-domain.example/webhooks/twilio"
```

Set the sender's incoming-message webhook to that exact URL using `POST`. The configured URL is used for Twilio signature verification and must match the externally visible URL. Keep the auth token secret. English messages receive a concise signal assessment; Hindi and Telugu-script messages receive a notice instead of an unreliable verdict because the current detector is English-oriented. Inbound message text is not written to the FactLens audit log by this webhook. A live messaging number and public deployment are not included in this repository.

## Train with a labeled dataset

The repository does not include a large news corpus. Provide a licensed CSV, JSON, or JSONL file with these fields:

```text
text,label
"Article text here",real
"Another article here",fake
```

Accepted fake labels include `fake`, `false`, `misleading`, `1`, and `fabricated`. Accepted real labels include `real`, `true`, `credible`, `0`, and `genuine`.

Install the training dependencies and run:

```powershell
cd backend
python -m pip install -r requirements.txt
python train_model.py --data data/news.csv
```

The trainer creates `backend/models/verity_text_model.joblib`, holds out 20% of the data for evaluation, and prints accuracy, precision, recall, F1, and a classification report. The API automatically blends this learned classifier into the existing ensemble when the artifact is present. Until then, it uses the deterministic fallback and does not claim trained-model accuracy.
