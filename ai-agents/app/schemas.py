from typing import Literal

from pydantic import BaseModel, Field


class AgentReply(BaseModel):
    replyText: str = Field(..., description="The WhatsApp reply to send. Plain text, no markdown.")
    language: Literal["en", "hi", "hinglish"] = Field(..., description="Language of the reply")
    needsHuman: bool = Field(default=False, description="true if the customer asked for a person")


class ReplyRequest(BaseModel):
    accountId: str = Field(..., min_length=1, examples=["acc_A"])
    leadId: str = Field(..., min_length=1, examples=["6ac5e78025ebf94c256f30fe"])
    waMessageId: str = Field(..., min_length=1, examples=["wamid.4efeddf7270947b48c7dc2482094855a"])
    text: str = Field(default="", examples=["Hi, 2BHK ka price kya hai?"])


class ReplyResponse(BaseModel):
    accountId: str
    leadId: str
    waMessageId: str
    replyText: str
    sender: Literal["ai", "fallback"]
    llmMs: int = 0


class HealthResponse(BaseModel):
    ok: bool
    model: str


class ErrorResponse(BaseModel):
    error: str
    detail: str = ""