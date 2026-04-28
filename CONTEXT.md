# CONTEXT.md

## Project Overview

This repository contains a two-service application named **DocuMind**:

- **Frontend**: Next.js app with NextAuth (GitHub OAuth) for user login and token acquisition.
- **Backend**: FastAPI service that receives `github_token` per request, analyzes repos, generates docstrings via OpenRouter, and optionally creates PRs.

The frontend and backend are run independently from root scripts.

## Root Paths

- `/home/curator/TCS/Prototype/run-frontend.sh`
- `/home/curator/TCS/Prototype/run-backend.sh`
- `/home/curator/TCS/Prototype/CONTEXT.md`
- `/home/curator/TCS/Prototype/frontend/`
- `/home/curator/TCS/Prototype/backend/`

## Frontend Structure

- `/home/curator/TCS/Prototype/frontend/package.json`
- `/home/curator/TCS/Prototype/frontend/.env.local.example`
- `/home/curator/TCS/Prototype/frontend/README.md`
- `/home/curator/TCS/Prototype/frontend/src/auth.ts`
- `/home/curator/TCS/Prototype/frontend/src/types/next-auth.d.ts`
- `/home/curator/TCS/Prototype/frontend/src/lib/utils.ts`
- `/home/curator/TCS/Prototype/frontend/src/app/layout.tsx`
- `/home/curator/TCS/Prototype/frontend/src/app/page.tsx` (login page)
- `/home/curator/TCS/Prototype/frontend/src/app/dashboard/page.tsx` (protected server page)
- `/home/curator/TCS/Prototype/frontend/src/app/api/auth/[...nextauth]/route.ts`
- `/home/curator/TCS/Prototype/frontend/src/components/providers.tsx`
- `/home/curator/TCS/Prototype/frontend/src/components/dashboard-shell.tsx`
- `/home/curator/TCS/Prototype/frontend/src/components/dashboard-client.tsx`
- `/home/curator/TCS/Prototype/frontend/src/components/ui/button.tsx`
- `/home/curator/TCS/Prototype/frontend/src/components/ui/select.tsx`
- `/home/curator/TCS/Prototype/frontend/src/components/ui/card.tsx`
- `/home/curator/TCS/Prototype/frontend/src/components/ui/badge.tsx`
- `/home/curator/TCS/Prototype/frontend/src/components/ui/separator.tsx`

### Frontend Behavior

- Uses `next-auth@4` with GitHub provider and `repo` scope.
- Stores GitHub access token in session (`session.accessToken`).
- `/dashboard` redirects to `/` when unauthenticated.
- Dashboard fetches repositories from GitHub API:
  - `GET https://api.github.com/user/repos`
- Dashboard triggers pipeline:
  - `POST http://localhost:8000/repos/docstring-pipeline`
  - request body includes: `{ owner, repo, github_token, max_files }`

## Backend Structure

- `/home/curator/TCS/Prototype/backend/app/main.py`
- `/home/curator/TCS/Prototype/backend/requirements.txt`
- `/home/curator/TCS/Prototype/backend/.env.example`
- `/home/curator/TCS/Prototype/backend/README.md`

### Backend Environment Variables

- `OPENROUTER_API_KEY` (required for LLM calls)
- `FRONTEND_URL` (default: `http://localhost:3000`)
- `FRONTEND_URLS` (optional comma-separated extra allowed origins)

### CORS Configuration

Configured in FastAPI with allowed origins including:

- `FRONTEND_URL`
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- values from `FRONTEND_URLS`

Methods allowed: `GET, POST, PUT, PATCH, DELETE, OPTIONS`

Headers allowed: `Authorization, Content-Type, Accept, X-Requested-With`

## API Endpoints

### `GET /health`
Returns service health.

### `GET /`
Returns basic status message.

### `POST /repos/readme`
Creates or updates `README.md` in a repo.

Request body:

```json
{
  "github_token": "...",
  "owner": "...",
  "repo": "...",
  "content": "..."
}
```

### `POST /repos/analyze`
Fetches recursive tree and filters files.

Request body:

```json
{
  "github_token": "...",
  "owner": "...",
  "repo": "..."
}
```

Filtering logic excludes:

- `node_modules`
- `.env*`
- common binary extensions

### `POST /repos/docstring-pipeline`
Main pipeline endpoint.

Request body:

```json
{
  "github_token": "...",
  "owner": "...",
  "repo": "...",
  "max_files": 20
}
```

Pipeline stages:

1. Analyze repo tree
2. Select supported code files by extension map
3. Fetch file contents from GitHub
4. Generate documented file content using OpenRouter model `deepseek/deepseek-v4-flash`
5. Generate `CONTEXT.md` from completed files
6. Generate `README.md` from generated context
7. If completion ratio >= 50%, create branch, commit files, open PR

GitHub write flow:

- `GET /repos/{owner}/{repo}/git/ref/heads/main`
- `POST /repos/{owner}/{repo}/git/refs`
- `PUT /repos/{owner}/{repo}/contents/{path}` for each file
- `POST /repos/{owner}/{repo}/pulls`

PR details:

- Title: `AI Generated Documentation`
- Body: `Auto-generated docstrings, CONTEXT.md, and README.md by DocuMind`

Pipeline response shape:

```json
{
  "completed_files": { "path": "documented content" },
  "skipped_files": ["path1", "path2"],
  "context_md": "...",
  "readme_md": "...",
  "pr_url": "...",
  "status": "complete"
}
```

`status` is `partial` on failures/timeouts or when completion ratio is below 50%.

## Extension to Language Mapping

Defined in backend (`EXTENSION_MAP`):

- `.py` -> Python
- `.ts` -> TypeScript
- `.tsx` -> TypeScript React
- `.js` -> JavaScript
- `.jsx` -> JavaScript React
- `.rs` -> Rust
- `.go` -> Go
- `.java` -> Java
- `.cpp` -> C++
- `.c` -> C
- `.cs` -> C#
- `.rb` -> Ruby
- `.php` -> PHP
- `.swift` -> Swift
- `.kt` -> Kotlin

## Run Instructions

From repository root:

```bash
./run-backend.sh
```

```bash
./run-frontend.sh
```

Backend runs on `http://localhost:8000`.
Frontend runs on `http://localhost:3000`.

## Notes

- Backend does not handle OAuth; it requires `github_token` in request bodies.
- Frontend is responsible for authentication and token acquisition via NextAuth.
- Generated and dependency directories (`node_modules`, `.next`, `.venv`, `venv`) are intentionally excluded from this context map.
