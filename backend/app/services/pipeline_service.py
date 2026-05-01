```python
from datetime import datetime, timezone
import re
import asyncio

import openai
from fastapi import HTTPException

from app.config import settings
from app.constants import DOCSTRING_FORMATS, EXTENSION_MAP, MAX_TOKENS, MODEL_ID
from app.logging_config import logger
from app.services.github_service import GitHubService


class PipelineService:
    """
    Service orchestrating the pipeline for generating documentation for a GitHub repository.

    This includes fetching files, generating docstrings via an LLM, creating a CONTEXT.md,
    a README.md, and optionally opening a pull request with the changes.
    """

    def __init__(self, github_service: GitHubService) -> None:
        """
        Initializes the PipelineService with a GitHub service and an LLM client.

        Args:
            github_service (GitHubService): An instance of GitHubService for repository interactions.

        Raises:
            HTTPException: If the OpenRouter API key is not configured.
        """
        self.github = github_service
        if not settings.openrouter_api_key:
            raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not configured")
        self.llm_client = openai.AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
            timeout=settings.llm_timeout_seconds,
            max_retries=1,
        )

    async def _llm_completion(self, prompt: str):
        """
        Sends a prompt to the LLM and returns the response.

        Args:
            prompt (str): The prompt to send to the LLM.

        Returns:
            The response object from the LLM API.

        Raises:
            asyncio.TimeoutError: If the request times out.
        """
        return await asyncio.wait_for(
            self.llm_client.chat.completions.create(
                model=MODEL_ID,
                max_tokens=MAX_TOKENS,
                messages=[{"role": "user", "content": prompt}],
            ),
            timeout=settings.llm_timeout_seconds,
        )

    async def _llm_completion_with_retry(self, prompt: str, attempts: int = 2):
        """
        Calls the LLM with retry logic for timeout errors.

        Args:
            prompt (str): The prompt to send.
            attempts (int, optional): Maximum number of attempts. Defaults to 2.

        Returns:
            The response object from the LLM API.

        Raises:
            Exception: The last exception encountered if all attempts fail.
            RuntimeError: If the call fails without a captured exception.
        """
        last_error: Exception | None = None
        for attempt in range(1, max(attempts, 1) + 1):
            try:
                return await self._llm_completion(prompt)
            except TimeoutError as exc:
                last_error = exc
                logger.warning(
                    "LLM timeout attempt=%s/%s prompt_chars=%s",
                    attempt,
                    attempts,
                    len(prompt),
                )
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "LLM call failed attempt=%s/%s prompt_chars=%s",
                    attempt,
                    attempts,
                    len(prompt),
                    exc_info=True,
                )
                break
        if last_error:
            raise last_error
        raise RuntimeError("LLM call failed without captured exception")

    @staticmethod
    def _fallback_readme(owner: str, repo: str, context_md: str) -> str:
        """
        Generates a fallback README when the primary generation fails or times out.

        Args:
            owner (str): The repository owner (user or organization).
            repo (str): The repository name.
            context_md (str): The CONTEXT.md content (possibly truncated) to include.

        Returns:
            str: A markdown string for the fallback README.
        """
        context_excerpt = context_md.strip()
        if len(context_excerpt) > 6000:
            context_excerpt = context_excerpt[:6000] + "\n\n... (truncated)"
        return (
            f"# {repo}\n\n"
            "## Overview\n"
            "This README was generated from repository context after the primary README generation timed out.\n\n"
            "## Features\n"
            "- See `CONTEXT.md` for architecture and module details.\n\n"
            "## File Structure\n"
            "- Refer to repository tree and `CONTEXT.md`.\n\n"
            "## Usage\n"
            "- Use examples and interfaces documented in `CONTEXT.md` and source files.\n\n"
            "## Setup\n"
            f"1. Clone `{owner}/{repo}`.\n"
            "2. Install dependencies for your stack.\n"
            "3. Run the project using the documented entry points.\n\n"
            "## Notes\n"
            "- Auto-generated fallback README.\n\n"
            "## Context Snapshot\n\n"
            f"{context_excerpt}\n"
        )

    @staticmethod
    def get_language_for_path(path: str) -> str | None:
        """
        Determines the programming language for a given file path based on its extension.

        Args:
            path (str): The file path.

        Returns:
            str | None: The language name if the extension is known, otherwise None.
        """
        lowered = path.lower()
        for ext, language in EXTENSION_MAP.items():
            if lowered.endswith(ext):
                return language
        return None

    @staticmethod
    def build_docstring_prompt(language: str, file_content: str) -> str:
        """
        Constructs a prompt for the LLM to add docstrings to a given file.

        Args:
            language (str): The programming language of the file.
            file_content (str): The complete content of the file.

        Returns:
            str: A formatted prompt instructing the LLM to generate docstrings.
        """
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

    @staticmethod
    def _extract_usage(response: object) -> tuple[int, int, int]:
        """
        Extracts token usage statistics from an LLM response.

        Args:
            response (object): The response object from the LLM API (expected to have a 'usage' attribute).

        Returns:
            tuple[int, int, int]: A tuple of (prompt_tokens, completion_tokens, total_tokens).
        """
        usage = getattr(response, "usage", None)
        if not usage:
            return (0, 0, 0)
        prompt_tokens = int(getattr(usage, "prompt_tokens", 0) or 0)
        completion_tokens = int(getattr(usage, "completion_tokens", 0) or 0)
        total_tokens = int(getattr(usage, "total_tokens", prompt_tokens + completion_tokens) or 0)
        return (prompt_tokens, completion_tokens, total_tokens)

    @staticmethod
    def _generic_name_confidence(source: str) -> tuple[str, str]:
        """
        Analyzes the source code for generic function names and returns a confidence flag.

        Args:
            source (str): The source code content.

        Returns:
            tuple[str, str]: A tuple with confidence level ("low" or "high") and a reason string.
        """
        generic_names = {"handle", "process", "run", "do"}
        matches = re.findall(r"\b(?:def|function|func)\s+([A-Za-z_][A-Za-z0-9_]*)", source)
        for name in matches:
            lowered = name.lower()
            for generic in generic_names:
                if lowered == generic or lowered.startswith(f"{generic}_") or lowered.startswith(generic):
                    return ("low", f"generic_function_name:{name}")
        return ("high", "no_generic_function_names_detected")

    async def run(self, owner: str, repo: str, max_files: int) -> dict:
        """
        Executes the full documentation pipeline (non‑streaming version).

        Steps:
        1. Fetch repository tree and filter supported code files.
        2. For each selected file, call the LLM to add docstrings.
        3. Generate CONTEXT.md and README.md from the documented files.
        4. Create a pull request with the new documentation if enough files were processed.

        Args:
            owner (str): The repository owner (user or organization).
            repo (str): The repository name.
            max_files (int): Maximum number of code files to process.

        Returns:
            dict: A dictionary containing the pipeline results (completed files, skipped files,
                  context markdown, readme markdown, PR URL, status, diffs, confidence flags, token usage).
        """
        logger.info("Pipeline start owner=%s repo=%s max_files=%s", owner, repo, max_files)

        completed_files: dict[str, str] = {}
        skipped_files: list[dict[str, str]] = []
        context_md = ""
        readme_md = ""
        pr_url = ""
        status = "partial"
        file_diffs: list[dict[str, str]] = []
        confidence_flags: list[dict[str, str]] = []
        usage_prompt_tokens = 0
        usage_completion_tokens = 0
        usage_total_tokens = 0

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

                    response = await self._llm_completion(prompt)
                    p, c, t = self._extract_usage(response)
                    usage_prompt_tokens += p
                    usage_completion_tokens += c
                    usage_total_tokens += t
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
                    file_diffs.append(
                        {
                            "path": path,
                            "original_content": decoded,
                            "documented_content": documented_content,
                        }
                    )
                    confidence, reason = self._generic_name_confidence(decoded)
                    confidence_flags.append(
                        {
                            "path": path,
                            "confidence": confidence,
                            "reason": reason,
                        }
                    )
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
                    context_response = await self._llm_completion(context_prompt)
                    p, c, t = self._extract_usage(context_response)
                    usage_prompt_tokens += p
                    usage_completion_tokens += c
                    usage_total_tokens += t
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
                        readme_response = await self._llm_completion_with_retry(readme_prompt, attempts=2)
                        p, c, t = self._extract_usage(readme_response)
                        usage_prompt_tokens += p
                        usage_completion_tokens += c
                        usage_total_tokens += t
                        readme_md = readme_response.choices[0].message.content or ""
                        logger.info("README generation end response_chars=%s", len(readme_md))
                    except Exception:
                        logger.error("README generation failed", exc_info=True)
                        readme_md = self._fallback_readme(owner, repo, context_md)
                        logger.info("README fallback generated response_chars=%s", len(readme_md))

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
            "file_diffs": file_diffs,
            "confidence_flags": confidence_flags,
            "usage": {
                "prompt_tokens": usage_prompt_tokens,
                "completion_tokens": usage_completion_tokens,
                "total_tokens": usage_total_tokens,
            },
        }

    async def stream(self, owner: str, repo: str, max_files: int):
        """
        Executes the documentation pipeline with streaming progress updates.

        This is an async generator that yields status updates at each stage.
        The logic is identical to `run()`, but intermediate results are streamed.

        Args:
            owner (str): The repository owner (user or organization).
            repo (str): The repository name.
            max_files (int): Maximum number of code files to process.

        Yields:
            dict: A dictionary representing the current stage and status.
                  Stages: 'tree_fetch', 'file_done', 'context_done', 'readme_done', 'pr_done', 'error', 'pipeline_done'.
        """
        logger.info("Pipeline(stream) start owner=%s repo=%s max_files=%s", owner, repo, max_files)

        completed_files: dict[str, str] = {}
        skipped_files: list[dict[str, str]] = []
        context_md = ""
        readme_md = ""
        pr_url = ""
        status = "partial"
        file_diffs: list[dict[str, str]] = []
        confidence_flags: list[dict[str, str]] = []
        usage_prompt_tokens = 0
        usage_completion_tokens = 0
        usage_total_tokens = 0

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
            yield {"stage": "tree_fetch", "status": "done", "file_count": selected_count}

            context_source_parts: list[str] = []
            for file_item in selected_files:
                path = file_item["path"]
                try:
                    status_code, decoded = await self.github.fetch_file_content(owner, repo, path)
                    if status_code != 200:
                        skipped_files.append({"path": path, "reason": "content_fetch_failed"})
                        yield {"stage": "file_done", "path": path, "status": "skip", "reason": "content_fetch_failed"}
                        continue
                    if not decoded:
                        skipped_files.append({"path": path, "reason": "empty_content"})
                        yield {"stage": "file_done", "path": path, "status": "skip", "reason": "empty_content"}
                        continue

                    input_chars = len(decoded)
                    language = file_item["language"]
                    prompt = self.build_docstring_prompt(language, decoded)
                    logger.info("LLM call(stream) start path=%s language=%s prompt_chars=%s", path, language, len(prompt))
                    response = await self._llm_completion(prompt)
                    p, c, t = self._extract_usage(response)
                    usage_prompt_tokens += p
                    usage_completion_tokens += c
                    usage_total_tokens += t

                    documented_content = response.choices[0].message.content or ""
                    output_chars = len(documented_content)
                    if not documented_content:
                        skipped_files.append({"path": path, "reason": "empty_response"})
                        logger.info("LLM call(stream) end path=%s response_chars=%s result=skip", path, 0)
                        yield {"stage": "file_done", "path": path, "status": "skip", "reason": "empty_response"}
                        continue
                    if output_chars < (input_chars * 0.5):
                        skipped_files.append({"path": path, "reason": "response_truncated"})
                        logger.info(
                            "LLM call(stream) end path=%s response_chars=%s input_chars=%s result=skip reason=response_truncated",
                            path,
                            output_chars,
                            input_chars,
                        )
                        yield {"stage": "file_done", "path": path, "status": "skip", "reason": "response_truncated"}
                        continue
                    if output_chars < input_chars:
                        skipped_files.append({"path": path, "reason": "response_shorter_than_input"})
                        logger.info(
                            "LLM call(stream) end path=%s response_chars=%s input_chars=%s result=skip reason=response_shorter_than_input",
                            path,
                            output_chars,
                            input_chars,
                        )
                        yield {"stage": "file_done", "path": path, "status": "skip", "reason": "response_shorter_than_input"}
                        continue

                    completed_files[path] = documented_content
                    context_source_parts.append(f"## FILE: {path}\n\n{documented_content}\n")
                    file_diffs.append(
                        {
                            "path": path,
                            "original_content": decoded,
                            "documented_content": documented_content,
                        }
                    )
                    confidence, reason = self._generic_name_confidence(decoded)
                    confidence_flags.append(
                        {
                            "path": path,
                            "confidence": confidence,
                            "reason": reason,
                        }
                    )
                    logger.info("LLM call(stream) end path=%s response_chars=%s result=success", path, output_chars)
                    yield {"stage": "file_done", "path": path, "status": "success"}
                except Exception:
                    logger.error("LLM call(stream) failed path=%s", path, exc_info=True)
                    skipped_files.append({"path": path, "reason": "llm_call_failed"})
                    yield {"stage": "file_done", "path": path, "status": "skip", "reason": "llm_call_failed"}

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
                    logger.info("CONTEXT.md generation(stream) start prompt_chars=%s", len(context_prompt))
                    context_response = await self._llm_completion(context_prompt)
                    p, c, t = self._extract_usage(context_response)
                    usage_prompt_tokens += p
                    usage_completion_tokens += c
                    usage_total_tokens += t
                    context_md = context_response.choices[0].message.content or ""
                    logger.info("CONTEXT.md generation(stream) end response_chars=%s", len(context_md))
                except Exception:
                    logger.error("CONTEXT.md generation(stream) failed", exc_info=True)
                    context_md = ""
                yield {"stage": "context_done", "status": "done"}

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
                        logger.info("README generation(stream) start prompt_chars=%s", len(readme_prompt))
                        readme_response = await self._llm_completion_with_retry(readme_prompt, attempts=2)
                        p, c, t = self._extract_usage(readme_response)
                        usage_prompt_tokens += p
                        usage_completion_tokens += c
                        usage_total_tokens += t
                        readme_md = readme_response.choices[0].message.content or ""
                        logger.info("README generation(stream) end response_chars=%s", len(readme_md))
                    except Exception:
                        logger.error("README generation(stream) failed", exc_info=True)
                        readme_md = self._fallback_readme(owner, repo, context_md)
                        logger.info("README fallback(stream) generated response_chars=%s", len(readme_md))
                yield {"stage": "readme_done", "status": "done"}

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
                    status = "complete"
                except Exception:
                    status = "partial"
            yield {"stage": "pr_done", "status": "done", "pr_url": pr_url}
        except Exception:
            status = "partial"
            yield {"stage": "error", "status": "failed"}

        result = {
            "completed_files": completed_files,
            "skipped_files": skipped_files,
            "context_md": context_md,
            "readme_md": readme_md,
            "pr_url": pr_url,
            "status": status,
            "file_diffs": file_diffs,
            "confidence_flags": confidence_flags,
            "usage": {
                "prompt_tokens": usage_prompt_tokens,
                "completion_tokens": usage_completion_tokens,
                "total_tokens": usage_total_tokens,
            },
        }
        yield {"stage": "pipeline_done", "result": result}
```