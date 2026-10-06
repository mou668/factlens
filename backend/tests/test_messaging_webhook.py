import base64
import hashlib
import hmac
import asyncio
import os
import unittest
from unittest.mock import patch
from xml.etree import ElementTree

from starlette.requests import Request

from app.detector import analyze_text
from app.main import (
    detect_message_language,
    format_message_assessment,
    twiml_message,
    twilio_message_webhook,
    verify_twilio_signature,
)


class MessagingWebhookTests(unittest.TestCase):
    def test_validates_twilio_signature(self):
        url = "https://factlens.example/webhooks/twilio"
        token = "test-token"
        form = {"Body": ["Check this"], "From": ["whatsapp:+15551234567"]}
        payload = url + "BodyCheck thisFromwhatsapp:+15551234567"
        signature = base64.b64encode(
            hmac.new(token.encode(), payload.encode(), hashlib.sha1).digest()
        ).decode()

        self.assertTrue(verify_twilio_signature(url, form, signature, token))
        self.assertFalse(verify_twilio_signature(url, form, "invalid", token))
        self.assertFalse(verify_twilio_signature(url, form, signature, ""))

    def test_detects_supported_script_cautions(self):
        self.assertEqual(detect_message_language("ఈ వార్త నిజమా?"), "te")
        self.assertEqual(detect_message_language("यह खबर सच है?"), "hi")
        self.assertEqual(detect_message_language("Is this claim accurate?"), "en")

    def test_formats_short_signal_reply(self):
        reply = format_message_assessment({
            "type": "fake",
            "confidence": 91,
            "riskSignals": ["clickbait language", "absolute claims"],
            "trustSignals": [],
        })

        self.assertIn("High-risk signals", reply)
        self.assertIn("91%", reply)
        self.assertIn("This is not proof", reply)

    def test_twiml_escapes_message_content(self):
        response = twiml_message("A & B < claim")
        root = ElementTree.fromstring(response.body)

        self.assertEqual(root.findtext("Message"), "A & B < claim")
        self.assertEqual(response.media_type, "application/xml")

    def test_messaging_analysis_does_not_write_audit(self):
        with patch("app.detector.write_audit_record") as write_audit:
            result = analyze_text("A short claim to inspect", record_audit=False)

        write_audit.assert_not_called()
        self.assertIsNone(result["auditId"])

    def test_webhook_verifies_request_and_returns_twiML(self):
        url = "https://factlens.example/webhooks/twilio"
        token = "test-token"
        body = b"Body=SHOCKING+claim&From=whatsapp%3A%2B15551234567"
        form = {"Body": ["SHOCKING claim"], "From": ["whatsapp:+15551234567"]}
        payload = url + "BodySHOCKING claimFromwhatsapp:+15551234567"
        signature = base64.b64encode(
            hmac.new(token.encode(), payload.encode(), hashlib.sha1).digest()
        ).decode()
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "POST",
            "scheme": "https",
            "server": ("factlens.example", 443),
            "client": ("127.0.0.1", 12345),
            "root_path": "",
            "path": "/webhooks/twilio",
            "raw_path": b"/webhooks/twilio",
            "query_string": b"",
            "headers": [(b"x-twilio-signature", signature.encode())],
        }

        async def receive():
            return {"type": "http.request", "body": body, "more_body": False}

        request = Request(scope, receive)
        result = {
            "type": "fake",
            "confidence": 90,
            "riskSignals": ["clickbait language"],
            "trustSignals": [],
        }
        with patch.dict(os.environ, {
            "FACTLENS_TWILIO_AUTH_TOKEN": token,
            "FACTLENS_TWILIO_WEBHOOK_URL": url,
        }), patch("app.main.analyze_text", return_value=result) as analyze:
            response = asyncio.run(twilio_message_webhook(request))

        analyze.assert_called_once_with("SHOCKING claim", language="en", record_audit=False)
        message = ElementTree.fromstring(response.body).findtext("Message")
        self.assertIn("High-risk signals", message)
        self.assertIn("not proof", message)


if __name__ == "__main__":
    unittest.main()