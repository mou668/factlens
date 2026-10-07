# FactLens Frontend

Static frontend for the FactLens claim signal review app.
The first screen is now login/register. After authentication, users enter the detection workflow.

## Run

```powershell
cd frontend
.\start_frontend.ps1
```

Then open `http://127.0.0.1:5500`.

For backend-backed results, start the backend first. The frontend calls:

```text
http://127.0.0.1:8000/analyze
```

If the backend is not running, the frontend falls back to a local deterministic detector so the app flow still works. Image attachments are previewed in the browser and sent to the backend for validation (PNG, JPEG, GIF, or WebP, up to 5 MB). This prototype does not analyze image contents; text is still required for a claim review.
