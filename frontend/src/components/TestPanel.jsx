import { useState } from "react";
import { api } from "../api/client";
import { FlaskIcon, CheckBadgeIcon } from "./Icons";

export default function TestPanel({ onSent }) {
    const [phone, setPhone] = useState("919800000099");
    const [name, setName] = useState("Test Lead");
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    async function handleSend(e) {
        e.preventDefault();
        if (!text.trim()) return;
        setLoading(true); setSuccess(""); setError("");
        try {
            await api.simulate(phone, name, text.trim());
            setSuccess("Message sent! AI reply in ~3s…");
            setText("");
            setTimeout(() => { setSuccess(""); onSent(); }, 3500);
        } catch (err) {
            setError("Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="test-panel">
            <h3 style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FlaskIcon size={16} style={{ color: "var(--accent)" }} />
                <span>Test panel — send a message as a customer</span>
            </h3>
            <form className="test-form" onSubmit={handleSend}>
                <input id="test-phone" className="test-input phone" placeholder="Phone (919800000099)"
                    value={phone} onChange={e => setPhone(e.target.value)} required />
                <input id="test-name" className="test-input name" placeholder="Name"
                    value={name} onChange={e => setName(e.target.value)} />
                <input id="test-message" className="test-input msg" placeholder="Type a customer message…"
                    value={text} onChange={e => setText(e.target.value)} required />
                <button id="test-send" className="btn btn-send" type="submit" disabled={loading}>
                    {loading ? "Sending…" : "Send"}
                </button>
            </form>
            {success && (
                <div className="test-success" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckBadgeIcon size={16} />
                    <span>{success}</span>
                </div>
            )}
            {error && <div className="error-msg" style={{ marginTop: 8 }}>{error}</div>}
        </div>
    );
}
