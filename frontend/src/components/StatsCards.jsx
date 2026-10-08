import React from "react";

export default function StatsCards({ stats }) {
    if (!stats) return null;

    return (
        <div className="stats-row">
            <div className="stat-card">
                <div className="stat-value">{stats.totalLeads ?? 0}</div>
                <div className="stat-label">Total Leads</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{stats.aiRepliesToday ?? 0}</div>
                <div className="stat-label">AI Replies Today</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{stats.avgReplySec || "0s"}</div>
                <div className="stat-label">Avg Reply Time</div>
            </div>
            <div className="stat-card warning">
                <div className="stat-value">{stats.fallbackCount ?? 0}</div>
                <div className="stat-label">Fallback Count</div>
            </div>
        </div>
    );
}
