from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.db import leads, messages, tenants


class TenantNotFound(Exception):
    pass


class LeadNotFound(Exception):
    pass


@dataclass(frozen=True)
class ChatMessage:
    direction: str
    sender: str
    text: str
    createdAt: datetime | None = None


@dataclass(frozen=True)
class AgentContext:
    tenant: dict[str, Any]
    lead: dict[str, Any]
    history: list[ChatMessage]


def load_context(accountId: str, leadId: str, limit: int = 10) -> AgentContext:
    tenant = tenants().find_one({"accountId": accountId})
    if not tenant:
        raise TenantNotFound(accountId)

    try:
        oid = ObjectId(leadId)
    except InvalidId as exc:
        raise LeadNotFound(leadId) from exc

    lead = leads().find_one({"_id": oid, "accountId": accountId})
    if not lead:
        raise LeadNotFound(leadId)

    cursor = (
        messages()
        .find({"accountId": accountId, "leadId": oid})
        .sort([("createdAt", -1), ("_id", -1)])
        .limit(limit)
    )
    history = [
        ChatMessage(
            direction=doc.get("direction", "in"),
            sender=doc.get("sender", "lead"),
            text=doc.get("text", ""),
            createdAt=doc.get("createdAt"),
        )
        for doc in cursor
    ]
    history.reverse()

    return AgentContext(tenant=tenant, lead=lead, history=history)