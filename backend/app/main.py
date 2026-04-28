from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas import AnalyzeRepoRequest, CreateReadmeRequest, DocstringPipelineRequest
from app.services.github_service import GitHubService
from app.services.pipeline_service import PipelineService

app = FastAPI(title="Prototype API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)


def _require_token(token: str) -> None:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated with GitHub")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "FastAPI server is running"}


@app.post("/repos/readme")
async def create_or_update_readme(payload: CreateReadmeRequest) -> dict[str, Any]:
    _require_token(payload.github_token)
    github = GitHubService(payload.github_token)
    return await github.create_or_update_readme(payload.owner, payload.repo, payload.content)


@app.post("/repos/analyze")
async def analyze_repo(payload: AnalyzeRepoRequest) -> dict[str, Any]:
    _require_token(payload.github_token)
    github = GitHubService(payload.github_token)
    return await github.analyze_repo(payload.owner, payload.repo)


@app.post("/repos/docstring-pipeline")
async def docstring_pipeline(payload: DocstringPipelineRequest) -> dict[str, Any]:
    _require_token(payload.github_token)
    github = GitHubService(payload.github_token)
    pipeline = PipelineService(github)
    return await pipeline.run(payload.owner, payload.repo, payload.max_files)
