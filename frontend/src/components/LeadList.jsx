import { InboxIcon } from "./Icons";

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function initials(name) {
    return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function LeadsList({ leads, selectedId, onSelect }) {
    return (
        <div className="leads-panel">
            <div className="leads-header">
                <h2 style={{ display: "inline" }}>Leads</h2>
                <span>{leads.length}</span>
            </div>
            <div className="leads-list">
                {leads.length === 0 && (
                    <div className="empty-state">
                        <div><InboxIcon size={36} style={{ color: "var(--text2)" }} /></div>
                        <div>No leads yet.<br />Send a test message below.</div>
                    </div>
                )}
                {leads.map(lead => {
                    const id = lead.leadId || lead._id;
                    return (
                        <div
                            key={id}
                            className={`lead-item ${selectedId === id ? "active" : ""}`}
                            onClick={() => onSelect(id)}
                        >
                            <div className="lead-avatar-wrap">
                                <div className="lead-avatar">{initials(lead.name)}</div>
                                {lead.unreadCount > 0 && (
                                    <span className="unread-badge">{lead.unreadCount > 99 ? "99+" : lead.unreadCount}</span>
                                )}
                            </div>
                            <div className="lead-info">
                                <div className="lead-name">
                                    {lead.name || lead.phone}
                                    {lead.humanTakeover && <span className="badge-off">AI OFF</span>}
                                </div>
                                <div className="lead-preview">{lead.lastMessageText || lead.phone}</div>
                            </div>
                            <div className="lead-time">{timeAgo(lead.lastMessageAt)}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
