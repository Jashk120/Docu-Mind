# FastAPI Backend (GitHub OAuth)

## 1) Configure env

```bash
cd backend
cp .env.example .env
```

Create a GitHub OAuth App and set callback URL to:

`http://localhost:8000/auth/github/callback`

Then fill `.env` values.

## 2) Install and run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
set -a; source .env; set +a
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /auth/github/login`
- `GET /auth/github/callback`
- `GET /auth/session`
- `POST /repos/readme`
