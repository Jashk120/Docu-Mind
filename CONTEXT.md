```markdown
# CONTEXT.md

## Repository: Jashk120/Docu-Mind

### Architecture Overview

Docu-Mind is an AI-powered documentation generator that analyzes GitHub repositories via a FastAPI backend and a Next.js frontend. It uses the OpenRouter API (LLM) to generate docstrings, CONTEXT.md, and README.md files, and then creates a pull request with the generated documentation.

- **Backend** (`backend/`): FastAPI application with CORS support, GitHub API integration, and an LLM-based pipeline service.
- **Frontend** (`frontend/`): Next.js application with GitHub OAuth (NextAuth), analytics dashboard, and streaming pipeline UI.
- **Database**: PostgreSQL via Prisma ORM (stores users, projects, pipeline runs, and file records).
- **Object Storage**: Local filesystem-based storage for generated markdown and file contents (via `lib/storage`).
- **LLM**: OpenRouter API (OpenAI-compatible) with configurable model, timeout, and retries.

### Modules

#### Backend Modules

| Module | Path | Purpose |
|--------|------|---------|
| `app/config.py` | `backend/app/config.py` | Loads environment variables (FRONTEND_URL, OPENROUTER_API_KEY, LLM_TIMEOUT) into a frozen dataclass `Settings`. Provides `allowed_origins` for CORS. |
| `app/logging_config.py` | `backend/app/logging_config.py` | Configures root logger `documind` with INFO level and standard formatting. |
| `app/main.py` | `backend/app/main.py` | FastAPI app definition. Defines endpoints: `/health`, `/`, `/repos/readme`, `/repos/analyze`, `/repos/docstring-pipeline` (POST+stream). Adds CORS middleware. |
| `app/schemas.py` | `backend/app/schemas.py` | Pydantic models: `CreateReadmeRequest`, `AnalyzeRepoRequest`, `DocstringPipelineRequest` (with optional `max_files` defaulting to 200). |
| `app/services/github_service.py` | `backend/app/services/github_service.py` | `GitHubService` class. Methods: `create_or_update_readme`, `analyze_repo` (fetches tree, filters binary/excluded), `fetch_file_content`, `create_pr_with_files` (creates branch, commits, opens PR). |
| `app/services/pipeline_service.py` | `backend/app/services/pipeline_service.py` | `PipelineService` class. Orchestrates: fetching files, LLM docstring generation (with retry/truncation checks), CONTEXT.md generation, README generation (with fallback), PR creation. Provides `run()` (non-streaming) and `stream()` (async generator yielding SSE events). |
| `app/constants.py` (implicit) | `backend/app/constants.py` | Contains `BINARY_EXTENSIONS`, `DOCSTRING_FORMATS`, `EXTENSION_MAP`, `MAX_TOKENS`, `MODEL_ID` (not shown but referenced). |

#### Frontend Modules

| Module | Path | Purpose |
|--------|------|---------|
| `app/layout.tsx` | `frontend/src/app/layout.tsx` | Root layout with Inter font, global CSS, and `<Providers>` wrapper. |
| `app/page.tsx` | `frontend/src/app/page.tsx` | Login page with GitHub OAuth sign-in button. |
| `app/dashboard/page.tsx` | `frontend/src/app/dashboard/page.tsx` | Server component that checks authentication and renders `DashboardClient`. |
| `app/dashboard/dashboard-client.tsx` | `frontend/src/app/dashboard/dashboard-client.tsx` | Client component: repo selector, pipeline start button, step progress, diff viewer, CONTEXT.md viewer, confidence flags. Consumes streaming endpoint. |
| `app/analytics/page.tsx` | `frontend/src/app/analytics/page.tsx` | Server-side analytics dashboard showing total runs, success rate, avg duration, token usage, runs per day, avg files. |
| `app/api/auth/[...nextauth]/route.ts` | `frontend/src/app/api/auth/[...nextauth]/route.ts` | NextAuth API route handler. |
| `app/api/projects/route.ts` | `frontend/src/app/api/projects/route.ts` | GET: list user's projects. POST: create project from pipeline result (stores metadata, file diffs, usage). |
| `app/api/projects/[id]/route.ts` | `frontend/src/app/api/projects/[id]/route.ts` | GET: fetch a single project. DELETE: delete project and its storage prefix. |
| `app/api/projects/[id]/files/route.ts` | `frontend/src/app/api/projects/[id]/files/route.ts` | GET: retrieve a file's content from object storage (validates path). |
| `app/api/runs/route.ts` | `frontend/src/app/api/runs/route.ts` | GET: list pipeline runs with files. POST: save new run and project (writes files to storage, creates DB records). |
| `next.config.ts` | `frontend/next.config.ts` | Configures image remote patterns for GitHub avatars. |

### Setup Assumptions

- **Environment Variables**:
  - `FRONTEND_URL` (default: `http://localhost:3000`)
  - `FRONTEND_URLS` (comma-separated additional origins)
  - `OPENROUTER_API_KEY` (required for LLM)
  - `LLM_TIMEOUT_SECONDS` (default: 120)
  - GitHub OAuth credentials (for NextAuth)
  - Database connection string (Prisma)
- **Dependencies**:
  - Backend: Python 3.10+ with FastAPI, httpx, openai, python-dotenv, pydantic.
  - Frontend: Node.js 18+ with Next.js 14, next-auth, prisma, @prisma/client.
- **Object storage**: Local file system under `storage/` directory (configurable via `lib/storage`).
- **LLM model**: Defined in `constants.py` as `MODEL_ID`; uses OpenRouter's chat completions endpoint.
- **GitHub token**: Must be a personal access token with `repo` scope (provided by user via OAuth or direct input).

### Key Flows

#### 1. Authentication (Frontend)
- User clicks "Continue with GitHub" → `signIn("github", { callbackUrl: "/dashboard" })`.
- NextAuth handles OAuth, stores session with `accessToken`.
- Server-side `getServerSession(authOptions)` checks authentication; redirects if missing.

#### 2. Pipeline Execution (Non‑streaming, `/repos/docstring-pipeline`)
1. **Analyze repo**: `GitHubService.analyze_repo()` fetches tree, filters binary/excluded files.
2. **Select files**: Up to `max_files` code files (supported languages via `EXTENSION_MAP`).
3. **For each file**:
   - `fetch_file_content()` → content.
   - Build LLM prompt for docstring generation.
   - Call LLM with retry logic.
   - Validate response length (≥50% of input).
   - Store documented content, diffs, confidence flags.
4. **Generate CONTEXT.md**: Send all documented files to LLM with prompt to produce repository-level context.
5. **Generate README.md**: Send CONTEXT.md to LLM (with retry). Fallback if timeout/error.
6. **Create PR**: If ≥50% files processed, create branch, commit all files + CONTEXT.md + README.md, open PR.
7. Return result dict with `completed_files`, `skipped_files`, `context_md`, `readme_md`, `pr_url`, `status`, `file_diffs`, `confidence_flags`, `usage`.

#### 3. Pipeline Execution (Streaming, `/repos/docstring-pipeline/stream`)
- Same logic as non‑streaming but yields SSE events for each stage: `tree_fetch`, `file_done`, `context_done`, `readme_done`, `pr_done`, `pipeline_done`.
- Frontend `DashboardClient` listens to events and updates progress bar, diff viewer, etc.
- After completion, frontend POSTs to `/api/runs` to persist the run and project.

#### 4. Frontend Analytics
- Server component queries database for user's projects.
- Calculates aggregate metrics (success rate, avg duration, total tokens).
- Renders cards and a runs-per-day bar chart.

### Notable Interfaces

#### Backend API Endpoints

| Method | Path | Input Schema | Output |
|--------|------|-------------|--------|
| GET | `/health` | — | `{"status":"ok"}` |
| GET | `/` | — | `{"message":"FastAPI server is running"}` |
| POST | `/repos/readme` | `CreateReadmeRequest` | `{"ok": bool, "commit_sha": str, "html_url": str}` |
| POST | `/repos/analyze` | `AnalyzeRepoRequest` | `{"ok": bool, "owner", "repo", "default_branch", "total_items", "filtered_items", "tree": [...]}` |
| POST | `/repos/docstring-pipeline` | `DocstringPipelineRequest` | full pipeline result dict (see above) |
| POST | `/repos/docstring-pipeline/stream` | `DocstringPipelineRequest` | Server‑Sent Events stream |

#### Frontend API Routes (Next.js)

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth authentication |
| GET | `/api/projects` | List projects for authenticated user |
| POST | `/api/projects` | Create project from pipeline result |
| GET | `/api/projects/[id]` | Get single project |
| DELETE | `/api/projects/[id]` | Delete project and storage |
| GET | `/api/projects/[id]/files?path=...` | Fetch file content from storage |
| GET | `/api/runs` | List pipeline runs (with files) |
| POST | `/api/runs` | Save pipeline run and project |

#### Schema (Pydantic Models)

- `CreateReadmeRequest`: `github_token`, `owner`, `repo`, `content`
- `AnalyzeRepoRequest`: `github_token`, `owner`, `repo`
- `DocstringPipelineRequest`: `github_token`, `owner`, `repo`, `max_files` (default 200)

#### Key Service Interfaces

- **`GitHubService(token)`**:
  - `analyze_repo(owner, repo)` → `dict`
  - `fetch_file_content(owner, repo, path)` → `(status_code, content_or_None)`
  - `create_pr_with_files(owner, repo, files_to_commit, branch_name)` → `pr_url`
  - `create_or_update_readme(owner, repo, content)` → `dict`
  - Static helpers: `is_binary_file(path)`, `is_excluded_path(path)`

- **`PipelineService(github_service)`**:
  - `run(owner, repo, max_files)` → `dict`
  - `stream(owner, repo, max_files)` → `async generator`
  - Internal: `_llm_completion(prompt)`, `_llm_completion_with_retry()`, `_extract_usage()`, `_generic_name_confidence()`, `_fallback_readme()`, `build_docstring_prompt()`.

#### Confidence Flags

- `confidence_flags` list with fields: `path`, `confidence` ("low"/"high"), `reason` (e.g., "generic_function_name:handle").

#### File Diff Format

- `file_diff`: `{ path, original_content, documented_content }`.
```