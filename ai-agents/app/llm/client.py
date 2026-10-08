from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import Literal

from langchain_groq import ChatGroq

from app.config import settings
from app.schemas import AgentReply
log = logging.getLogger("agent.llm")

_LADDERS = {
    "json_schema": ("json_schema", "json_mode", "off"),
    "json_mode": ("json_mode", "off"),
    "off": ("off",),
}


@dataclass(frozen=True)
class LlmResult:
    reply: AgentReply
    sender: Literal["ai", "fallback"]
    llmMs: int
    error: str | None = None


def _ms(start: float) -> int:
    return int((time.perf_counter() - start) * 1000)


def _llm() -> ChatGroq:
    return ChatGroq(
        api_key=settings.groq_api_key or None,
        model=settings.llm_model,
        temperature=0,
        max_tokens=300,
        timeout=settings.llm_timeout_ms / 1000,
        max_retries=settings.llm_max_retries,
    )


def _is_format_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(k in msg for k in ("response_format", "json_schema", "json object", "invalid_request", "status 400", "400"))


def _parse_loose(text: str) -> AgentReply:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    try:
        return AgentReply.model_validate(json.loads(cleaned))
    except Exception:
        return AgentReply(replyText=text.strip(), language="en", needsHuman=False)


def _content_to_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(b.get("text", "") for b in content if isinstance(b, dict))
    return str(content)


def _invoke(llm: ChatGroq, mode: str, messages: list[dict]) -> AgentReply:
    if mode == "off":
        raw = llm.invoke(messages)
        return _parse_loose(_content_to_text(raw.content))
    structured = llm.with_structured_output(AgentReply, method=mode)
    result = structured.invoke(messages)
    if isinstance(result, AgentReply):
        return result
    return AgentReply.model_validate(result)


def generate(messages: list[dict]) -> LlmResult:
    start = time.perf_counter()

    errors: list[str] = []
    try:
        llm = _llm()
    except Exception as exc:
        return LlmResult(
            AgentReply(replyText=settings.fallback_text, language="en"),
            "fallback",
            _ms(start),
            error=f"llm_init: {exc}",
        )

    ladder = _LADDERS.get(settings.llm_structured_mode, _LADDERS["json_schema"])
    for mode in ladder:
        try:
            reply = _invoke(llm, mode, messages)
            return LlmResult(reply, "ai", _ms(start))
        except Exception as exc:
            errors.append(f"{mode}: {exc}")
            log.warning("[AGENT] mode=%s failed: %s", mode, exc)
            if not _is_format_error(exc):
                break

    return LlmResult(
        AgentReply(replyText=settings.fallback_text, language="en"),
        "fallback",
        _ms(start),
        error=" | ".join(errors) or "unknown",
    )