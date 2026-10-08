from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from .config import settings
from .db import close_db, get_client
from .graph.agent import run_agent
from .history.loader import LeadNotFound, TenantNotFound
from .schemas import ErrorResponse, HealthResponse, ReplyRequest, ReplyResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger("agent")


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_client()
    yield
    close_db()


app = FastAPI(title="WhatsApp AI Agent", version="1.0", lifespan=lifespan)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        ok=True,
        model=settings.llm_model,
    )


@app.post("/reply", response_model=ReplyResponse, responses={404: {"model": ErrorResponse}})
def reply(req: ReplyRequest) -> ReplyResponse:
    try:
        state = run_agent(req.accountId, req.leadId, req.waMessageId, req.text)
    except TenantNotFound:
        raise HTTPException(status_code=404, detail={"error": "tenant_not_found", "detail": req.accountId})
    except LeadNotFound:
        raise HTTPException(status_code=404, detail={"error": "lead_not_found", "detail": req.leadId})

    return ReplyResponse(
        accountId=req.accountId,
        leadId=req.leadId,
        waMessageId=req.waMessageId,
        replyText=state.get("replyText", settings.fallback_text),
        sender=state.get("sender", "fallback"),
        llmMs=state.get("llmMs", 0),
    )