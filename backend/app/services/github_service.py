import base64
from typing import Any

import httpx
from fastapi import HTTPException

from app.constants import BINARY_EXTENSIONS


class GitHubService:
    def __init__(self, token: str) -> None:
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    @staticmethod
    def is_binary_file(path: str) -> bool:
        lowered = path.lower()
        return any(lowered.endswith(ext) for ext in BINARY_EXTENSIONS)

    @staticmethod
    def is_excluded_path(path: str) -> bool:
        parts = path.split("/")
        return "node_modules" in parts or any(part.startswith(".env") for part in parts)

    async def create_or_update_readme(self, owner: str, repo: str, content: str) -> dict[str, Any]:
        api_base = f"https://api.github.com/repos/{owner}/{repo}/contents/README.md"
        content_b64 = base64.b64encode(content.encode("utf-8")).decode("utf-8")

        async with httpx.AsyncClient(timeout=30.0) as client:
            get_resp = await client.get(api_base, headers=self.headers)
            body: dict[str, Any] = {"message": "Create README via app", "content": content_b64}

            if get_resp.status_code == 200:
                existing = get_resp.json()
                body["sha"] = existing.get("sha")
                body["message"] = "Update README via app"
            elif get_resp.status_code != 404:
                raise HTTPException(status_code=get_resp.status_code, detail=f"Could not check README: {get_resp.text}")

            put_resp = await client.put(api_base, headers=self.headers, json=body)

        if put_resp.status_code not in (200, 201):
            raise HTTPException(status_code=put_resp.status_code, detail=put_resp.text)

        data = put_resp.json()
        return {
            "ok": True,
            "commit_sha": data.get("commit", {}).get("sha"),
            "html_url": data.get("content", {}).get("html_url"),
        }

    async def analyze_repo(self, owner: str, repo: str) -> dict[str, Any]:
        repo_api = f"https://api.github.com/repos/{owner}/{repo}"

        async with httpx.AsyncClient(timeout=45.0) as client:
            repo_resp = await client.get(repo_api, headers=self.headers)
            if repo_resp.status_code != 200:
                raise HTTPException(status_code=repo_resp.status_code, detail=repo_resp.text)
            default_branch = repo_resp.json().get("default_branch", "main")

            branch_resp = await client.get(f"{repo_api}/branches/{default_branch}", headers=self.headers)
            if branch_resp.status_code != 200:
                raise HTTPException(status_code=branch_resp.status_code, detail=branch_resp.text)

            tree_sha = branch_resp.json().get("commit", {}).get("commit", {}).get("tree", {}).get("sha")
            if not tree_sha:
                raise HTTPException(status_code=502, detail="Could not resolve repository tree SHA")

            tree_resp = await client.get(f"{repo_api}/git/trees/{tree_sha}?recursive=1", headers=self.headers)
            if tree_resp.status_code != 200:
                raise HTTPException(status_code=tree_resp.status_code, detail=tree_resp.text)

        tree = tree_resp.json().get("tree", [])
        filtered_tree = [
            item for item in tree
            if not self.is_excluded_path(item.get("path", "")) and not self.is_binary_file(item.get("path", ""))
        ]

        return {
            "ok": True,
            "owner": owner,
            "repo": repo,
            "default_branch": default_branch,
            "total_items": len(tree),
            "filtered_items": len(filtered_tree),
            "tree": filtered_tree,
        }

    async def fetch_file_content(self, owner: str, repo: str, path: str) -> tuple[int, str | None]:
        repo_api = f"https://api.github.com/repos/{owner}/{repo}"
        async with httpx.AsyncClient(timeout=45.0) as client:
            content_resp = await client.get(f"{repo_api}/contents/{path}", headers=self.headers)
            if content_resp.status_code != 200:
                return content_resp.status_code, None
            encoded = content_resp.json().get("content", "")
            if not encoded:
                return 200, None
            try:
                decoded = base64.b64decode(encoded).decode("utf-8")
            except Exception:
                return 200, None
            return 200, decoded

    async def create_pr_with_files(
        self,
        owner: str,
        repo: str,
        files_to_commit: dict[str, str],
        branch_name: str,
    ) -> str:
        repo_api = f"https://api.github.com/repos/{owner}/{repo}"

        async with httpx.AsyncClient(timeout=45.0) as client:
            base_ref_resp = await client.get(f"{repo_api}/git/ref/heads/main", headers=self.headers)
            if base_ref_resp.status_code != 200:
                raise HTTPException(status_code=base_ref_resp.status_code, detail=base_ref_resp.text)
            base_sha = base_ref_resp.json().get("object", {}).get("sha")
            if not base_sha:
                raise HTTPException(status_code=502, detail="Could not resolve base SHA for main branch")

            create_ref_resp = await client.post(
                f"{repo_api}/git/refs",
                headers=self.headers,
                json={"ref": f"refs/heads/{branch_name}", "sha": base_sha},
            )
            if create_ref_resp.status_code not in (201, 422):
                raise HTTPException(status_code=create_ref_resp.status_code, detail=create_ref_resp.text)

            for path, content in files_to_commit.items():
                existing_sha = None
                existing_resp = await client.get(
                    f"{repo_api}/contents/{path}",
                    headers=self.headers,
                    params={"ref": branch_name},
                )
                if existing_resp.status_code == 200:
                    existing_sha = existing_resp.json().get("sha")
                elif existing_resp.status_code != 404:
                    raise HTTPException(status_code=existing_resp.status_code, detail=existing_resp.text)

                put_body: dict[str, Any] = {
                    "message": f"docs: update {path}",
                    "content": base64.b64encode(content.encode("utf-8")).decode("utf-8"),
                    "branch": branch_name,
                }
                if existing_sha:
                    put_body["sha"] = existing_sha

                put_resp = await client.put(f"{repo_api}/contents/{path}", headers=self.headers, json=put_body)
                if put_resp.status_code not in (200, 201):
                    raise HTTPException(status_code=put_resp.status_code, detail=put_resp.text)

            pr_resp = await client.post(
                f"{repo_api}/pulls",
                headers=self.headers,
                json={
                    "title": "AI Generated Documentation",
                    "body": "Auto-generated docstrings, CONTEXT.md, and README.md by DocuMind",
                    "head": branch_name,
                    "base": "main",
                },
            )
            if pr_resp.status_code != 201:
                raise HTTPException(status_code=pr_resp.status_code, detail=pr_resp.text)

        return pr_resp.json().get("html_url", "")
