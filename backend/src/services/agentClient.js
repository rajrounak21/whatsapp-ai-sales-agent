const AGENT_URL = process.env.AGENT_URL || "http://127.0.0.1:8000/reply";
const AGENT_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS || 45000);

async function callAgent({ accountId, leadId, waMessageId, text }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
    try {
        const res = await fetch(AGENT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId, leadId, waMessageId, text }),
            signal: controller.signal,
        });
        if (!res.ok) throw new Error(`agent HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { callAgent };