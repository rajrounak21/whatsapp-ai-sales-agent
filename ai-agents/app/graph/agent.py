from __future__ import annotations

import logging

from langgraph.graph import END, START, StateGraph

from app.config import settings
from app.history.loader import load_context
from app.llm.client import generate
from app.prompts.builder import build_messages
from .state import AgentState

log = logging.getLogger("agent.graph")


def _load_context(state: AgentState) -> dict:
    ctx = load_context(state["accountId"], state["leadId"], settings.history_limit)
    return {"tenant": ctx.tenant, "lead": ctx.lead, "history": ctx.history}


def _build_prompt(state: AgentState) -> dict:
    return {
        "messages": build_messages(
            state["tenant"],
            state["lead"],
            state["history"],
            state.get("inboundText", ""),
        )
    }


def _generate(state: AgentState) -> dict:
    result = generate(state["messages"])
    log.info(
        "[AGENT] accountId=%s leadId=%s waMessageId=%s sender=%s llmMs=%d error=%s",
        state["accountId"],
        state["leadId"],
        state["waMessageId"],
        result.sender,
        result.llmMs,
        result.error,
    )
    return {
        "replyText": result.reply.replyText,
        "language": result.reply.language,
        "needsHuman": result.reply.needsHuman,
        "sender": result.sender,
        "llmMs": result.llmMs,
        "error": result.error,
    }


def _respond(state: AgentState) -> dict:
    return {}


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("load_context", _load_context)
    graph.add_node("build_prompt", _build_prompt)
    graph.add_node("generate", _generate)
    graph.add_node("respond", _respond)
    graph.add_edge(START, "load_context")
    graph.add_edge("load_context", "build_prompt")
    graph.add_edge("build_prompt", "generate")
    graph.add_edge("generate", "respond")
    graph.add_edge("respond", END)
    return graph.compile()


GRAPH = build_graph()


def run_agent(accountId: str, leadId: str, waMessageId: str, inboundText: str) -> AgentState:
    return GRAPH.invoke(
        {
            "accountId": accountId,
            "leadId": leadId,
            "waMessageId": waMessageId,
            "inboundText": inboundText,
        }
    )