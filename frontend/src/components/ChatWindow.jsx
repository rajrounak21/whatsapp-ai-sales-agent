import { useEffect, useRef, useState } from "react";
import { ChatIcon, AlertBadgeIcon } from "./Icons";
import { api } from "../api/client";

function formatTime(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWindow({ lead, messages, onTakeover, onReplySent }) {
    const bottomRef = useRef(null);
    const containerRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const prevLeadIdRef = useRef(null);

    const leadId = lead ? (lead.leadId || lead._id) : null;

    useEffect(() => {
        if (!leadId) return;

        const isNewLead = prevLeadIdRef.current !== leadId;
        prevLeadIdRef.current = leadId;

        const container = containerRef.current;
        if (!container) return;

        // Check if user is scrolled near bottom (within 120px)
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;

        // Auto-scroll only when switching leads or when already near bottom
        if (isNewLead || isNearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: isNewLead ? "auto" : "smooth" });
        }
    }, [messages, leadId]);

    if (!lead) {
        return (
            <div className="chat-panel">
                <div className="no-chat">
                    <div className="icon"><ChatIcon size={44} style={{ color: "var(--border)" }} /></div>
                    <div>Select a lead to see the conversation</div>
                </div>
            </div>
        );
    }

    async function toggleAI() {
        setBusy(true);
        await onTakeover(leadId, !lead.humanTakeover);
        setBusy(false);
    }

    async function handleSendReply(e) {
        e.preventDefault();
        if (!replyText.trim() || sending) return;
        setSending(true);
        try {
            await api.sendHumanReply(leadId, replyText.trim());
            setReplyText("");
            if (onReplySent) onReplySent();
        } catch (err) {
            alert("Failed to send reply: " + (err.message || "Error"));
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <div className="chat-header-info">
                    <h3>{lead.name || lead.phone}</h3>
                    <p>{lead.phone}</p>
                </div>
                <div className="toggle-wrap">
                    <span className={`toggle-label ${!lead.humanTakeover ? "active" : ""}`}>AI</span>
                    <button
                        id={`toggle-${leadId}`}
                        className={`toggle ${!lead.humanTakeover ? "on" : ""}`}
                        onClick={toggleAI}
                        disabled={busy}
                        title={lead.humanTakeover ? "AI is OFF" : "AI is ON"}
                    />
                    <span className="toggle-label" style={lead.humanTakeover ? { color: "#f85149", fontWeight: 600 } : {}}>
                        Human
                    </span>
                </div>
            </div>

            <div className="chat-messages" ref={containerRef}>
                {lead.humanTakeover && (
                    <div className="ai-paused-banner">
                        <AlertBadgeIcon size={15} style={{ marginRight: 6 }} /> AI paused — human is handling this chat
                    </div>
                )}
                {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 14, marginTop: 40 }}>
                        No messages yet
                    </div>
                )}
                {messages.map((msg, i) => {
                    const isOut = msg.direction === "out";
                    const isFallback = msg.sender === "fallback";
                    const isHuman = msg.sender === "human";
                    const senderTagClass = isFallback ? "fallback" : isHuman ? "human" : "ai";
                    const senderTagLabel = isFallback ? "Fallback" : isHuman ? "Human" : "AI";

                    return (
                        <div key={msg.messageId || msg._id || i} className={`msg-row ${msg.direction} ${isFallback ? "fallback" : ""}`}>
                            <div className="msg-bubble">
                                {msg.text}
                                <div className="msg-meta">
                                    <span>{formatTime(msg.createdAt)}</span>
                                    {isOut && (
                                        <span className={`sender-tag ${senderTagClass}`}>
                                            {senderTagLabel}
                                        </span>
                                    )}
                                    {isOut && msg.latencyMs && (
                                        <span>replied in {(msg.latencyMs / 1000).toFixed(1)}s</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {lead.humanTakeover && (
                <form className="human-reply-bar" onSubmit={handleSendReply}>
                    <input
                        type="text"
                        className="human-reply-input"
                        placeholder="Type a human reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button type="submit" className="btn btn-send" disabled={sending || !replyText.trim()}>
                        {sending ? "Sending..." : "Send"}
                    </button>
                </form>
            )}
        </div>
    );
}
