from datetime import datetime, timezone

import openai
from fastapi import HTTPException

from app.config import settings
from app.constants import DOCSTRING_FORMATS, EXTENSION_MAP, MAX_TOKENS, MODEL_ID
from app.logging_config import logger
from app.services.github_service import GitHubService


class PipelineService:
    def __init__(self, github_service: GitHubService) -> None:
        self.github = github_service
        if not settings.openrouter_api_key:
            raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not configured")
        self.llm_client = openai.AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )

    @staticmethod
    def get_language_for_path(path: str) -> str | None:
        lowered = path.lower()
        for ext, language in EXTENSION_MAP.items():
            if lowered.endswith(ext):
                return language
        return None

    @staticmethod
    def build_docstring_prompt(language: str, file_content: str) -> str:
        format_example = DOCSTRING_FORMATS.get(language, "")
        return (
            f"You are a documentation expert. Given the following {language} file, \n"
            "add standard docstrings to every function, method, and class.\n\n"
            "Rules:\n"
            f"- Use the exact docstring format standard for {language}\n"
            "- Do not change any logic or variable names\n"
            "- Do not add comments inside function bodies\n"
            "- If a function's purpose is unclear, infer it from context\n"
            "- Return the complete file with docstrings added, nothing else\n"
            "- Return the COMPLETE file with docstrings added. Do not omit any code. Do not summarize. Every single line of the original file must be present in your response, with docstrings added above each function\n\n"
            "Docstring format example:\n"
            f"{format_example}\n\n"
            "File content:\n"
            f"{file_content}"
        )

    async def run(self, owner: str, repo: str, max_files: int) -> dict:
        logger.info("Pipeline start owner=%s repo=%s max_files=%s", owner, repo, max_files)

        completed_files: dict[str, str] = {}
        skipped_files: list[dict[str, str]] = []
        context_md = ""
        readme_md = ""
        pr_url = ""
        status = "partial"

        try:
            analyze_data = await self.github.analyze_repo(owner, repo)
            tree = analyze_data.get("tree", [])

            code_files = []
            for item in tree:
                if item.get("type") != "blob":
                    continue
                path = item.get("path", "")
                language = self.get_language_for_path(path)
                if language:
                    code_files.append({"path": path, "language": language})

            selected_files = code_files[: max(max_files, 0)]
            selected_count = len(selected_files)
            logger.info(
                "File tree fetch owner=%s repo=%s total_filtered_tree=%s supported_code_files=%s selected_files=%s",
                owner,
                repo,
                len(tree),
                len(code_files),
                selected_count,
            )

            context_source_parts: list[str] = []
            for file_item in selected_files:
                path = file_item["path"]
                try:
                    status_code, decoded = await self.github.fetch_file_content(owner, repo, path)
                    if status_code != 200:
                        skipped_files.append({"path": path, "reason": "content_fetch_failed"})
                        continue
                    if not decoded:
                        skipped_files.append({"path": path, "reason": "empty_content"})
                        continue

                    input_chars = len(decoded)
                    language = file_item["language"]
                    prompt = self.build_docstring_prompt(language, decoded)
                    logger.info("LLM call start path=%s language=%s prompt_chars=%s", path, language, len(prompt))

                    response = await self.llm_client.chat.completions.create(
                        model=MODEL_ID,
                        max_tokens=MAX_TOKENS,
                        messages=[{"role": "user", "content": prompt}],
                    )
                    documented_content = response.choices[0].message.content or ""
                    output_chars = len(documented_content)

                    if not documented_content:
                        skipped_files.append({"path": path, "reason": "empty_response"})
                        logger.info("LLM call end path=%s response_chars=%s result=skip", path, 0)
                        continue
                    if output_chars < (input_chars * 0.5):
                        skipped_files.append({"path": path, "reason": "response_truncated"})
                        logger.info(
                            "LLM call end path=%s response_chars=%s input_chars=%s result=skip reason=response_truncated",
                            path,
                            output_chars,
                            input_chars,
                        )
                        continue
                    if output_chars < input_chars:
                        skipped_files.append({"path": path, "reason": "response_shorter_than_input"})
                        logger.info(
                            "LLM call end path=%s response_chars=%s input_chars=%s result=skip reason=response_shorter_than_input",
                            path,
                            output_chars,
                            input_chars,
                        )
                        continue

                    completed_files[path] = documented_content
                    context_source_parts.append(f"## FILE: {path}\n\n{documented_content}\n")
                    logger.info("LLM call end path=%s response_chars=%s result=success", path, output_chars)
                except Exception:
                    logger.error("LLM call failed path=%s", path, exc_info=True)
                    skipped_files.append({"path": path, "reason": "llm_call_failed"})

            if completed_files:
                context_prompt = (
                    "You are generating a repository-level CONTEXT.md from documented source files.\n"
                    "Summarize architecture, modules, setup assumptions, key flows, and notable interfaces.\n"
                    "Return only markdown for CONTEXT.md.\n\n"
                    f"Repository: {owner}/{repo}\n\n"
                    "Documented files:\n\n"
                    + "\n".join(context_source_parts)
                )
                try:
                    logger.info("CONTEXT.md generation start prompt_chars=%s", len(context_prompt))
                    context_response = await self.llm_client.chat.completions.create(
                        model=MODEL_ID,
                        max_tokens=MAX_TOKENS,
                        messages=[{"role": "user", "content": context_prompt}],
                    )
                    context_md = context_response.choices[0].message.content or ""
                    logger.info("CONTEXT.md generation end response_chars=%s", len(context_md))
                except Exception:
                    logger.error("CONTEXT.md generation failed", exc_info=True)

                if context_md:
                    readme_prompt = (
                        "You are a technical writer. Based on the CONTEXT.md below, generate a clean README.md.\n\n"
                        "Rules:\n"
                        "- Use proper markdown formatting\n"
                        "- Do not truncate any section\n"
                        '- Do not use placeholder text like "..." or "etc"\n'
                        "- Every code example must be complete and runnable\n"
                        "- Sections must be: Overview, Features, File Structure, Usage (one example per file), Setup, Notes\n\n"
                        "CONTEXT.md:\n"
                        f"{context_md}\n\n"
                        "Return only the README.md content, nothing else."
                    )
                    try:
                        logger.info("README generation start prompt_chars=%s", len(readme_prompt))
                        readme_response = await self.llm_client.chat.completions.create(
                            model=MODEL_ID,
                            max_tokens=MAX_TOKENS,
                            messages=[{"role": "user", "content": readme_prompt}],
                        )
                        readme_md = readme_response.choices[0].message.content or ""
                        logger.info("README generation end response_chars=%s", len(readme_md))
                    except Exception:
                        logger.error("README generation failed", exc_info=True)

            completion_ratio = (len(completed_files) / selected_count) if selected_count > 0 else 0.0
            if completion_ratio >= 0.5 and completed_files:
                branch_name = f"ai-docs/{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
                files_to_commit = dict(completed_files)
                if context_md:
                    files_to_commit["CONTEXT.md"] = context_md
                if readme_md:
                    files_to_commit["README.md"] = readme_md

                try:
                    pr_url = await self.github.create_pr_with_files(owner, repo, files_to_commit, branch_name)
                    logger.info("PR creation branch=%s files_committed=%s pr_url=%s", branch_name, len(files_to_commit), pr_url)
                    status = "complete"
                except Exception:
                    logger.error("PR creation failed", exc_info=True)
                    status = "partial"
        except Exception:
            logger.error("Pipeline exception owner=%s repo=%s", owner, repo, exc_info=True)
            status = "partial"

        logger.info(
            "Pipeline end owner=%s repo=%s completed=%s skipped=%s status=%s",
            owner,
            repo,
            len(completed_files),
            len(skipped_files),
            status,
        )
        return {
            "completed_files": completed_files,
            "skipped_files": skipped_files,
            "context_md": context_md,
            "readme_md": readme_md,
            "pr_url": pr_url,
            "status": status,
        }
