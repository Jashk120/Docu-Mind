# Docu-Mind

An AI-powered documentation generator that analyzes GitHub repositories via a FastAPI backend and a Next.js frontend. It leverages the OpenRouter API (LLM) to automatically generate docstrings, CONTEXT.md files, and README.md files, then creates a pull request with the generated documentation.

## Overview

Docu-Mind streamlines the documentation process for any GitHub repository. The backend fetches your repository's file tree, runs each supported source file through an LLM to produce docstrings and confidence flags, then synthesizes a full CONTEXT.md and README.md. Finally, it opens a pull request containing all new documentation. The frontend provides an interactive dashboard with streaming progress, diff viewing, and analytics dashboards.

## Features

- **Automated Docstring Generation** – Processes up to 200 files per pipeline run.
- **Context & README Generation** – Builds a CONTEXT.md for the whole repo and a polished README.md.
- **Streaming Pipeline** – Real-time progress via Server‑Sent Events (SSE).
- **GitHub Integration** – Fetches files, creates branches, commits, and pull requests.
- **Confidence Flags** – Highlights low‑confidence docstrings (e.g., generic function names).
- **Analytics Dashboard** – Track total runs, success rate, token usage, and daily activity.
- **Persistent Storage** – Saves generated files, diffs, and project metadata using a local filesystem and PostgreSQL (Prisma).

## File Structure

```
repo-root/
├── backend/
│   └── app/
│       ├── main.py                     # FastAPI app with endpoints
│       ├── config.py                   # Settings dataclass (env vars)
│       ├── logging_config.py           # Logging configuration
│       ├── schemas.py                  # Pydantic request models
│       ├── constants.py                # Binary extensions, model ID, etc.
│       └── services/
│           ├── github_service.py       # GitHub API interactions
│           └── pipeline_service.py     # LLM orchestration & streaming
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx              # Root layout with providers
│       │   ├── page.tsx                # Login page (GitHub OAuth)
│       │   ├── dashboard/
│       │   │   ├── page.tsx            # Server component (auth check)
│       │   │   └── dashboard-client.tsx# Client component (pipeline UI)
│       │   ├── analytics/
│       │   │   └── page.tsx            # Server component (analytics)
│       │   └── api/
│       │       ├── auth/[...nextauth]/route.ts
│       │       ├── projects/
│       │       │   ├── route.ts
│       │       │   └── [id]/route.ts + files/route.ts
│       │       └── runs/route.ts
│       ├── next.config.ts              # Config (GitHub avatar patterns)
│       └── ...
├── storage/                            # Local filesystem object store
├── prisma/                             # Prisma schema
└── README.md                           # This file
```

## Usage

### Backend – FastAPI Endpoints

Start the backend server:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

#### Example: Health Check

```python
import httpx

resp = httpx.get("http://localhost:8000/health")
print(resp.json())  # {"status": "ok"}
```

#### Example: Analyze a Repository

```python
import httpx

payload = {
    "github_token": "your_github_pat",
    "owner": "octocat",
    "repo": "Hello-World"
}
resp = httpx.post("http://localhost:8000/repos/analyze", json=payload)
print(resp.json())
# {"ok": true, "owner": "...", "repo": "...", "total_items": 10, "filtered_items": 5, "tree": [...]}
```

#### Example: Run Full Pipeline (Non‑streaming)

```python
import httpx

payload = {
    "github_token": "your_github_pat",
    "owner": "octocat",
    "repo": "Hello-World",
    "max_files": 10
}
resp = httpx.post("http://localhost:8000/repos/docstring-pipeline", json=payload)
result = resp.json()
print(result["pr_url"])      # URL of created PR
print(result["context_md"])  # Generated CONTEXT.md content
```

#### Example: Run Pipeline with Streaming

```python
import httpx
import json

payload = {
    "github_token": "your_github_pat",
    "owner": "octocat",
    "repo": "Hello-World",
    "max_files": 5
}
with httpx.stream("POST", "http://localhost:8000/repos/docstring-pipeline/stream", json=payload) as response:
    for line in response.iter_lines():
        if line.startswith("data: "):
            event = json.loads(line[6:])
            print(event["type"], event.get("data"))
            # Events: tree_fetch, file_done, context_done, readme_done, pr_done, pipeline_done
```

### Frontend – Next.js Dashboard

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` and click **Continue with GitHub** to authenticate. After OAuth, you will be redirected to the dashboard.

#### Dashboard Usage

1. Select an **owner** and **repository** from the input fields.
2. Click **Start Pipeline**.
3. Watch progress updates – each file processed emits a `file_done` event, followed by `context_done`, `readme_done`, and `pr_done`.
4. After completion, view the generated **CONTEXT.md** and **diff viewer** for each file.
5. The pipeline result is automatically saved under **Projects**.

#### Analytics Page

Navigate to `/analytics` to see aggregated metrics:

- Total pipeline runs
- Success rate (percentage of completed pipelines)
- Average duration per run
- Total token usage
- Runs per day (bar chart)
- Average number of files processed

The page queries the database directly using server‑side rendering.

### API Routes (Next.js)

All API routes are mounted under `http://localhost:3000/api`.

```bash
# List projects for authenticated user (requires session)
curl -H "Cookie: next-auth.session-token=..." http://localhost:3000/api/projects

# Create a new project (POST)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"pipelineResult": { ... }}'
```

## Setup

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** (or any Prisma‑supported database)
- **GitHub Personal Access Token** with `repo` scope (used by backend for API calls)
- **OpenRouter API Key** (for LLM completions)

### Environment Variables

Create a `.env` file in the backend directory:

```env
FRONTEND_URL=http://localhost:3000
FRONTEND_URLS=http://localhost:3000,https://yourdomain.com
OPENROUTER_API_KEY=your_openrouter_key
LLM_TIMEOUT_SECONDS=120
```

Create a `.env.local` file in the frontend directory:

```env
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/documind
```

### Install Dependencies

**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install fastapi uvicorn httpx openai python-dotenv pydantic
```

**Frontend**:
```bash
cd frontend
npm install
npx prisma generate
npx prisma db push   # creates tables
```

### Run

1. Start PostgreSQL and ensure the database `documind` exists.
2. Start backend: `uvicorn app.main:app --reload` (port 8000)
3. Start frontend: `npm run dev` (port 3000)

## Notes

- **Object Storage**: Generated files (diffs, CONTEXT.md, README.md) are stored in the `storage/` directory. The `lib/storage` module manages this location. You can change the root path by modifying the storage utility.
- **LLM Model**: The model ID is defined in `backend/app/constants.py` as `MODEL_ID`. Default uses OpenRouter's chat completions endpoint. You can override it with a different model string.
- **Binary & Excluded Files**: Files with extensions listed in `BINARY_EXTENSIONS` or paths matching `EXCLUDED_PATHS` are skipped during analysis.
- **Confidence Flags**: Docstrings for functions with generic names (e.g., `handle`, `process`) are flagged as `low` confidence. The reason field explains why.
- **Graceful Fallbacks**: If README generation fails (e.g., timeout), a fallback short README is created. If fewer than 50% of files are processed, no PR is opened.
- **Authentication**: Frontend uses NextAuth with GitHub OAuth. Backend receives the GitHub token directly in request bodies. Ensure your GitHub OAuth app is configured with the correct callback URL (`http://localhost:3000/api/auth/callback/github`).
- **Error Handling**: All API endpoints return structured JSON errors. Streaming endpoints yield error events.