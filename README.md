# FactLens

FactLens is a claim signal review app with separate frontend and backend folders.
The app now starts with login/register, then opens the fake news detection workflow after authentication.

## Project Structure

```text
.
+-- backend/
|   +-- app/
|   |   +-- __init__.py
|   |   +-- detector.py
|   |   +-- main.py
|   +-- README.md
|   +-- requirements.txt
+-- frontend/
|   +-- assets/
|   +-- src/
|   +-- index.html
|   +-- README.md
+-- README.md
```

## Run the Backend

```powershell
cd backend
.\start_backend.ps1
```

## Run the Frontend

```powershell
cd frontend
.\start_frontend.ps1
```

Then open `http://127.0.0.1:5500`.

The frontend calls `http://127.0.0.1:8000/analyze`. If the backend is not running, it uses a local fallback detector so the interface can still be tested.
