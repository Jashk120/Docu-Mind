from pydantic import BaseModel


class CreateReadmeRequest(BaseModel):
    github_token: str
    owner: str
    repo: str
    content: str


class AnalyzeRepoRequest(BaseModel):
    github_token: str
    owner: str
    repo: str


class DocstringPipelineRequest(BaseModel):
    github_token: str
    owner: str
    repo: str
    max_files: int = 200
