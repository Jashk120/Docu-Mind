```python
from pydantic import BaseModel


class CreateReadmeRequest(BaseModel):
    """Request model for creating a README file in a GitHub repository.

    Attributes:
        github_token (str): GitHub personal access token for authentication.
        owner (str): Owner of the repository (user or organization).
        repo (str): Name of the repository.
        content (str): Content of the README file to be created.
    """
    github_token: str
    owner: str
    repo: str
    content: str


class AnalyzeRepoRequest(BaseModel):
    """Request model for analyzing a GitHub repository.

    Attributes:
        github_token (str): GitHub personal access token for authentication.
        owner (str): Owner of the repository (user or organization).
        repo (str): Name of the repository.
    """
    github_token: str
    owner: str
    repo: str


class DocstringPipelineRequest(BaseModel):
    """Request model for the docstring pipeline execution.

    Attributes:
        github_token (str): GitHub personal access token for authentication.
        owner (str): Owner of the repository (user or organization).
        repo (str): Name of the repository.
        max_files (int, optional): Maximum number of files to process. Defaults to 200.
    """
    github_token: str
    owner: str
    repo: str
    max_files: int = 200
```