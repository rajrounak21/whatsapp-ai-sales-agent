const BASE = "";

async function req(method, path, body) {
    const res = await fetch(BASE + path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Object.assign(new Error(err.error || `HTTP ${res.status}`), { status: res.status });
    }
    return res.status === 204 ? null : res.json();
}

export const api = {
    login: (email, password) => req("POST", "/api/auth/login", { email, password }),
    me: () => req("GET", "/api/auth/me"),
    logout: () => req("POST", "/api/auth/logout"),
    leads: () => req("GET", "/api/leads"),
    messages: (leadId) => req("GET", `/api/leads/${leadId}/messages`).then((data) => (Array.isArray(data) ? data : data?.messages || [])),
    takeover: (leadId, enabled) => req("PATCH", `/api/leads/${leadId}/takeover`, { enabled }),
    simulate: (leadPhone, leadName, text) => req("POST", "/api/dev/simulate-message", { leadPhone, leadName, text }),
    stats: () => req("GET", "/api/stats"),
    sendHumanReply: (leadId, text) => req("POST", `/api/leads/${leadId}/reply`, { text }),
};
