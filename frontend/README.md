# DocuMind Frontend

## Configure

```bash
cd frontend
cp .env.local.example .env.local
```

Set GitHub OAuth app callback URL to:

`http://localhost:3000/api/auth/callback/github`

## Run

```bash
cd frontend
npm install
npm run dev
```

Pages:
- `/` login
- `/dashboard` protected dashboard
