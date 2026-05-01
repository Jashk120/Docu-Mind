```python
import json
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

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
    """
    Validates that a GitHub token is provided.

    Args:
        token (str): The GitHub token to check.

    Raises:
        HTTPException: If the token is empty or None, raises a 401 error.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated with GitHub")


@app.get("/health")
def health() -> dict[str, str]:
    """
    Health check endpoint.

    Returns:
        dict[str, str]: A dictionary indicating the server status.
    """
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    """
    Root endpoint providing a welcome message.

    Returns:
        dict[str, str]: A dictionary with a message confirming the server is running.
    """
    return {"message": "FastAPI server is running"}


@app.post("/repos/readme")
async def create_or_update_readme(payload: CreateReadmeRequest) -> dict[str, Any]:
    """
    Creates or updates a README file in a specified GitHub repository.

    Args:
        payload (CreateReadmeRequest): Request body containing GitHub token, owner, repo, and new content.

    Returns:
        dict[str, Any]: Result from the GitHub service operation.

    Raises:
        HTTPException: If the GitHub token is invalid or missing.
    """
    _require_token(payload.github_token)
    github = GitHubService(payload.github_token)
    return await github.create_or_update_readme(payload.owner, payload.repo, payload.content)


@app.post("/repos/analyze")
async def analyze_repo(payload: AnalyzeRepoRequest) -> dict[str, Any]:
    """
    Analyzes a GitHub repository to extract its structure and metadata.

    Args:
        payload (AnalyzeRepoRequest): Request body containing GitHub token, owner, and repo name.

    Returns:
        dict[str, Any]: Analysis results from the GitHub service.

    Raises:
        HTTPException: If the GitHub token is invalid or missing.
    """
    _require_token(payload.github_token)
    github = GitHubService(payload.github_token)
    return await github.analyze_repo(payload.owner, payload.repo)


@app.post("/repos/docstring-pipeline")
async def docstring_pipeline(payload: DocstringPipelineRequest) -> dict[str, Any]:
    """
    Runs the full docstring generation pipeline on a GitHub repository.

    Args:
        payload (DocstringPipelineRequest): Request body containing GitHub token, owner, repo, and optional max_files.

    Returns:
        dict[str, Any]: Results of the pipeline execution.

    Raises:
        HTTPException: If the GitHub token is invalid or missing.
    """
    _require_token(payload.github_token)
    github = GitHubService(payload.github_token)
    pipeline = PipelineService(github)
    return await pipeline.run(payload.owner, payload.repo, payload.max_files)


@app.post("/repos/docstring-pipeline/stream")
async def docstring_pipeline_stream(payload: DocstringPipelineRequest):
    """
    Streams events from the docstring generation pipeline as a server-sent event (SSE) stream.

    Args:
        payload (DocstringPipelineRequest): Request body containing GitHub token, owner, repo, and optional max_files.

    Returns:
        StreamingResponse: An SSE stream of pipeline events.

    Raises:
        HTTPException: If the GitHub token is invalid or missing.
    """
    _require_token(payload.github_token)
    github = GitHubService(payload.github_token)
    pipeline = PipelineService(github)

    async def event_generator():
        """
        Asynchronous generator that yields pipeline events as SSE-formatted data.

        Yields:
            str: A string in SSE format containing the event data.
        """
        async for event in pipeline.stream(payload.owner, payload.repo, payload.max_files):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```