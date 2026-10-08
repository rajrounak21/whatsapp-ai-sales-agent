import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import LeadsList from "../components/LeadList";
import ChatWindow from "../components/ChatWindow";
import TestPanel from "../components/TestPanel";
import StatsCards from "../components/StatsCards";
import { ChatIcon } from "../components/Icons";

const POLL_MS = 3000;

export default function Dashboard({ auth, onLogout }) {
    const [leads, setLeads] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [stats, setStats] = useState(null);
    const timerRef = useRef(null);

    const fetchLeads = async () => {
        try { setLeads(await api.leads()); } catch { }
    };

    const fetchStats = async () => {
        try { setStats(await api.stats()); } catch { }
    };

    const fetchMessages = async (id) => {
        if (!id) return;
        try { setMessages(await api.messages(id)); } catch { }
    };

    // 3-second polling
    useEffect(() => {
        fetchLeads();
        fetchStats();
        timerRef.current = setInterval(() => {
            fetchLeads();
            fetchStats();
            if (selectedId) fetchMessages(selectedId);
        }, POLL_MS);
        return () => clearInterval(timerRef.current);
    }, [selectedId]);

    useEffect(() => {
        if (selectedId) fetchMessages(selectedId);
        else setMessages([]);
    }, [selectedId]);

    async function handleLogout() {
        await api.logout().catch(() => { });
        onLogout();
    }

    async function handleTakeover(leadId, enabled) {
        await api.takeover(leadId, enabled);
        setLeads(prev => prev.map(l => ((l.leadId || l._id) === leadId ? { ...l, humanTakeover: enabled } : l)));
    }

    const selectedLead = leads.find(l => (l.leadId || l._id) === selectedId) || null;

    return (
        <div className="app">
            <header className="header">
                <span className="header-logo">
                    <ChatIcon size={22} style={{ color: "var(--accent)", display: "block" }} />
                </span>
                <div style={{ flex: 1 }}>
                    <div className="header-title">{auth.tenant?.businessName || "Dashboard"}</div>
                    <div className="header-sub">{auth.user?.email}</div>
                </div>
                <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            </header>

            <StatsCards stats={stats} />

            <div className="body">
                <LeadsList leads={leads} selectedId={selectedId} onSelect={setSelectedId} />
                <div className="right-panel">
                    <ChatWindow
                        lead={selectedLead}
                        messages={messages}
                        onTakeover={handleTakeover}
                        onReplySent={() => {
                            if (selectedId) fetchMessages(selectedId);
                            fetchLeads();
                            fetchStats();
                        }}
                    />
                </div>
            </div>
            <TestPanel onSent={() => { fetchLeads(); fetchStats(); }} />
        </div>
    );
}
