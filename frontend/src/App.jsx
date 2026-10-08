import { useState, useEffect } from "react";
import { api } from "./api/client";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
    const [auth, setAuth] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        api.me()
            .then(setAuth)
            .catch(() => setAuth(null))
            .finally(() => setChecking(false));
    }, []);

    if (checking) return (
        <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
    );

    if (!auth) return <Login onLogin={setAuth} />;
    return <Dashboard auth={auth} onLogout={() => setAuth(null)} />;
}
