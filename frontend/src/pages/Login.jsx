import { useState } from "react";
import { api } from "../api/client";
import { ChatIcon } from "../components/Icons";

export default function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const data = await api.login(email, password);
            onLogin({ user: data.user, tenant: data.tenant });
        } catch {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <ChatIcon size={24} style={{ color: "#000" }} />
                    </div>
                    <div>
                        <h1>WhatsApp AI Agent</h1>
                        <p>Multi-tenant CRM Dashboard</p>
                    </div>
                </div>
                <h2>Welcome back</h2>
                <p className="subtitle">Sign in to manage your leads</p>
                {error && <div className="error-msg">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" placeholder="owner@sunrise.test"
                            value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" placeholder="••••••••"
                            value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading
                            ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</>
                            : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
