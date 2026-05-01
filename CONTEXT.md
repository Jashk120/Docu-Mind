# CONTEXT.md

## Workspace Summary

This repository is a two-service DocuMind prototype:

- `frontend/`: Next.js app router project with NextAuth GitHub login, Prisma + SQLite, run/project UI, and artifact storage.
- `backend/`: FastAPI service that analyzes repos, runs docstring generation through OpenRouter, builds `CONTEXT.md` and `README.md`, and optionally opens PRs.

Snapshot date: 2026-04-29.

## Root Layout

- `/home/curator/TCS/Prototype/CONTEXT.md`
- `/home/curator/TCS/Prototype/run-frontend.sh`
- `/home/curator/TCS/Prototype/run-backend.sh`
- `/home/curator/TCS/Prototype/frontend/`
- `/home/curator/TCS/Prototype/backend/`
- `/home/curator/TCS/Prototype/files/` (auxiliary)

## Current End-to-End Flow

1. User authenticates in frontend via GitHub OAuth (NextAuth).
2. Dashboard triggers backend pipeline (typically streaming endpoint).
3. Backend processes eligible code files, adds docstrings, generates repo-level `CONTEXT.md` and `README.md`, and attempts PR creation when completion threshold is met.
4. Frontend persists run output through `POST /api/runs`.
5. `POST /api/runs` writes artifacts to disk and stores both run-level and project-level database records.
6. Projects UI reads stored records and loads artifact files from disk via project file API.

## Frontend State (Current)

### App Routes Present

- `/` landing/login
- `/dashboard` pipeline execution UI
- `/projects` saved runs/projects list
- `/projects/[id]` project artifact detail
- `/analytics` aggregate metrics
- API routes:
  - `/api/auth/[...nextauth]`
  - `/api/runs`
  - `/api/projects`
  - `/api/projects/[id]`
  - `/api/projects/[id]/files`

Note: there is no active `/documentation` route in `src/app` right now.

### Navigation

- Shared navbar component: `frontend/src/components/app-navbar.tsx`
- Tabs currently rendered: Dashboard, Projects, Analytics

### Data Persistence

- Prisma schema includes NextAuth tables plus:
  - `PipelineRun`
  - `PipelineRunFile`
  - `Project`
- `POST /api/runs` does all of:
  - stores `README.md` and `CONTEXT.md` and completed files under:
    - `frontend/storage/{owner}/{repo}/{ISO-timestamp-sanitized}/...`
  - creates a `PipelineRun` with child `PipelineRunFile` rows
  - creates a `Project` row with status, token/duration summary, storage path, diff/confidence JSON snapshots

### Project APIs

- `GET /api/projects`: list projects for authenticated user, ordered by `timestamp desc`
- `GET /api/projects/[id]`: fetch one project scoped to authenticated user
- `DELETE /api/projects/[id]`: delete project row only
- `GET /api/projects/[id]/files?path=...`: secure file read from `project.storagePath` with traversal checks

## Backend State (Current)

### API Endpoints in `backend/app/main.py`

- `GET /health`
- `GET /`
- `POST /repos/readme`
- `POST /repos/analyze`
- `POST /repos/docstring-pipeline`
- `POST /repos/docstring-pipeline/stream` (SSE)

### Pipeline Behavior (`pipeline_service.py`)

- Filters repo tree by supported code extensions.
- Processes up to `max_files` and skips invalid/failed outputs.
- Tracks token usage (`prompt_tokens`, `completion_tokens`, `total_tokens`).
- Generates repo-level `CONTEXT.md` then `README.md` (with retry and fallback README on failure).
- Attempts PR creation only if completion ratio is at least 50%.
- Returns completed files, skipped files, usage, status, PR URL, file diffs, and confidence flags.

### Backend Auth Pattern

- Backend is stateless with respect to user session.
- GitHub token is required on each request payload.

## Runtime / Environment

### Frontend

- Key dependencies observed:
  - `next@16.2.4`
  - `react@19.2.4`
  - `next-auth@4.24.14`
  - `prisma@6.17.1`
- Uses SQLite datasource (`DATABASE_URL`, usually `file:./prisma/dev.db`).

### Backend

- Python FastAPI app with OpenRouter-backed LLM calls via `openai.AsyncOpenAI` configured with OpenRouter base URL.
- Requires `OPENROUTER_API_KEY`.

### Common Local Defaults

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

Root scripts:

```bash
./run-backend.sh
./run-frontend.sh
```

## Known Caveats

1. `frontend/src/components/dashboard-client.tsx` exists alongside active `frontend/src/app/dashboard/dashboard-client.tsx`; the app-router version is the active dashboard implementation.
2. Backend README appears outdated (mentions legacy `/auth/github/*` endpoints not present in current `main.py`).
3. Deleting a project through API removes DB metadata but does not remove saved artifact files under `frontend/storage/`.
4. `frontend/storage/` includes historical generated snapshots (for example under `Jashk120/...`) that are data artifacts, not active app source.
