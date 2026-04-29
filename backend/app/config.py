import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    frontend_url: str
    frontend_urls: list[str]
    openrouter_api_key: str
    llm_timeout_seconds: float

    @property
    def allowed_origins(self) -> list[str]:
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
