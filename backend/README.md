Django backend for Travora

Quick start

1. Create a virtualenv and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and fill in your Supabase values. A `.env` already exists in this repo with keys.

3. Run migrations and start the dev server:

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

API
- `GET /api/videos/` — proxies to Supabase `videos` table and returns JSON.

Expo integration
- Point your Expo app fetches to the Django server (e.g. `http://<machine-ip>:8000/api/videos/`).
