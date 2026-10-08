import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _str(key: str, default: str) -> str:
    return os.getenv(key, default)


def _int(key: str, default: int) -> int:
    return int(os.getenv(key, str(default)))


@dataclass(frozen=True)
class Settings:
    mongo_uri: str = field(default_factory=lambda: _str("MONGO_URI", "mongodb://localhost:27017/whatsapp_ai"))
    db_name: str = field(default_factory=lambda: _str("DB_NAME", "whatsapp_ai"))

    groq_api_key: str = field(default_factory=lambda: _str("GROQ_API_KEY", ""))
    llm_model: str = field(default_factory=lambda: _str("LLM_MODEL", "openai/gpt-oss-120b"))
    llm_timeout_ms: int = field(default_factory=lambda: _int("LLM_TIMEOUT_MS", 20000))
    llm_max_retries: int = field(default_factory=lambda: _int("LLM_MAX_RETRIES", 3))
    llm_structured_mode: str = field(default_factory=lambda: _str("LLM_STRUCTURED_MODE", "json_schema").lower())
    fallback_text: str = field(default_factory=lambda: _str("FALLBACK_TEXT", "Thanks for your message! Our team will get back to you shortly."))

    history_limit: int = field(default_factory=lambda: _int("HISTORY_LIMIT", 10))
    agent_port: int = field(default_factory=lambda: _int("AGENT_PORT", 8000))


settings = Settings()