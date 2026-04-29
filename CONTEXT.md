# CONTEXT.md

## Workspace Summary

This workspace contains a two-service DocuMind prototype:

- `frontend/` is a Next.js app (NextAuth GitHub login + UI + SQLite/Prisma storage)
- `backend/` is a FastAPI app (GitHub + OpenRouter documentation pipeline)

Current date context in this workspace: 2026-04-29.

## Root Paths

- `/home/curator/TCS/Prototype/run-frontend.sh`
- `/home/curator/TCS/Prototype/run-backend.sh`
- `/home/curator/TCS/Prototype/CONTEXT.md`
- `/home/curator/TCS/Prototype/frontend/`
- `/home/curator/TCS/Prototype/backend/`

## Current Workflow

1. User logs in with GitHub via NextAuth.
2. Dashboard loads user repos from GitHub and starts pipeline.
3. Frontend calls backend streaming endpoint:
   - `POST /repos/docstring-pipeline/stream`
4. Backend generates documented files + `README.md` + `CONTEXT.md` and (if eligible) opens a PR.
5. Frontend posts pipeline result to `POST /api/runs`.
6. `POST /api/runs` persists:
   - `PipelineRun` + `PipelineRunFile` rows
   - `Project` row (run summary + storage metadata)
   - artifact files on disk under `frontend/storage/{owner}/{repo}/{timestamp}/`
7. UI links to `/projects/[id]` for saved artifact inspection.

## Frontend (Current)

### Key Routes

- `/` login page
- `/dashboard` main pipeline UI
- `/projects` project/run cards
- `/projects/[id]` artifact detail (README, CONTEXT, Diff, Confidence)
- `/documentation` pipeline run history (from `PipelineRun`)
- `/analytics` aggregate metrics (from `Project`)

### Shared Navbar

- Implemented as reusable client component:
  - `/home/curator/TCS/Prototype/frontend/src/components/app-navbar.tsx`
- Used across dashboard/projects/documentation/analytics.
- Active tab is highlighted by pathname prefix matching.

### Auth

- Uses `next-auth@4` with `PrismaAdapter` and GitHub provider.
- Session strategy: database.
- `session.accessToken` is populated from linked GitHub account token.
- `session.user.id` is explicitly set in session callback and is used for auth guards/data lookups.

### Storage and Project APIs

- `POST /api/runs`:
  - writes files to `frontend/storage/...`
  - creates `Project` record with owner/repo/timestamp/pr/status/file counts/token usage/duration/storage path
  - stores diff + confidence JSON snapshots
- `GET /api/projects`: list projects for logged-in user
- `GET /api/projects/[id]`: single project metadata
- `DELETE /api/projects/[id]`: delete project record
- `GET /api/projects/[id]/files?path=...`: read stored file contents with path traversal protection

### Prisma Models in Active Use

- `Project` is now run-oriented, not manual CRUD metadata.
- `PipelineRun`/`PipelineRunFile` still exist and power `/documentation`.

## Backend (Current)

### Key Files

- `/home/curator/TCS/Prototype/backend/app/main.py`
- `/home/curator/TCS/Prototype/backend/app/services/pipeline_service.py`
- `/home/curator/TCS/Prototype/backend/app/services/github_service.py`

### API Endpoints

- `GET /health`
- `GET /`
- `POST /repos/readme`
- `POST /repos/analyze`
- `POST /repos/docstring-pipeline`
- `POST /repos/docstring-pipeline/stream`

### Auth Model

- Backend is stateless re OAuth session.
- GitHub token is supplied per request from frontend session token.

## Environment Variables

### Frontend (`frontend/.env.local`)

- `NEXT_PUBLIC_API_BASE=http://localhost:8000`
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET=...`
- `GITHUB_ID=...`
- `GITHUB_SECRET=...`

### Backend (`backend/.env`)

- `FRONTEND_URL=http://localhost:3000`
- `FRONTEND_URLS=` (optional comma-separated list)
- `OPENROUTER_API_KEY=...`

## Run Commands

From root:

```bash
./run-backend.sh
./run-frontend.sh
```

Default ports:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## Audit Findings / Known Mismatches

1. `frontend/src/components/dashboard-client.tsx` is legacy/unused; active dashboard is `src/app/dashboard/dashboard-client.tsx`.
2. `Project` model changed significantly; stale Prisma client/dev server instances can cause runtime errors like unknown `timestamp` field. Fix: run `npx prisma generate && npx prisma db push` and restart frontend dev server.
3. `/documentation` still reads `PipelineRun` while `/projects` and `/analytics` rely on `Project`; this split is intentional now but can confuse expectations if not documented.
4. `frontend/storage/` is currently append-only; deleting a `Project` row does not remove artifact files on disk.
