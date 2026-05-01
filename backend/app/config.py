```python
import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    """
    Immutable configuration settings loaded from environment variables.

    Attributes:
        frontend_url (str): Primary frontend URL.
        frontend_urls (list[str]): Additional frontend URLs.
        openrouter_api_key (str): API key for OpenRouter LLM service.
        llm_timeout_seconds (float): Timeout in seconds for LLM requests.
    """
    frontend_url: str
    frontend_urls: list[str]
    openrouter_api_key: str
    llm_timeout_seconds: float

    @property
    def allowed_origins(self) -> list[str]:
        """
        Returns a deduplicated list of allowed CORS origins.

        Combines the primary frontend URL, development hosts, and any
        additional frontend URLs specified in the configuration.

        Returns:
            list[str]: List of unique origin strings allowed for CORS.
        """
        return list(
            {
                self.frontend_url,
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                *self.frontend_urls,
            }
        )


settings = Settings(
    frontend_url=os.getenv("FRONTEND_URL", "http://localhost:3000"),
    frontend_urls=[url.strip() for url in os.getenv("FRONTEND_URLS", "").split(",") if url.strip()],
    openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
    llm_timeout_seconds=float(os.getenv("LLM_TIMEOUT_SECONDS", "120")),
)
```