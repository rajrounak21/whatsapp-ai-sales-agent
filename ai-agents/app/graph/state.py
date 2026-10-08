from __future__ import annotations

from typing import NotRequired, TypedDict

from app.history.loader import ChatMessage


class AgentState(TypedDict):
    accountId: str
    leadId: str
    waMessageId: str
    inboundText: str
    tenant: NotRequired[dict]
    lead: NotRequired[dict]
    history: NotRequired[list[ChatMessage]]
    messages: NotRequired[list[dict]]
    replyText: NotRequired[str]
    language: NotRequired[str]
    needsHuman: NotRequired[bool]
    sender: NotRequired[str]
    llmMs: NotRequired[int]
    error: NotRequired[str]