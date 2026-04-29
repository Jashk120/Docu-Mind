# DocuMind Frontend

## Configure

```bash
cd frontend
cp .env.local.example .env.local
```

Also ensure `.env` has SQLite:

```env
DATABASE_URL="file:./prisma/dev.db"
```

Set GitHub OAuth callback URL to:

`http://localhost:3000/api/auth/callback/github`

## Database

```bash
cd frontend
npx prisma generate
npx prisma db push
```

## Run

```bash
cd frontend
npm install
npm run dev
```

Pages:
- `/` login
- `/dashboard` pipeline
- `/documentation` run history + skipped reasons
- `/analytics` run metrics + tokens usage
