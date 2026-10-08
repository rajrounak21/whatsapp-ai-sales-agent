import React from "react";

export function ChatIcon({ size = 20, className = "", style = {} }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`svg-icon ${className}`}
            style={style}
        >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
    );
}

export function InboxIcon({ size = 40, className = "", style = {} }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`svg-icon ${className}`}
            style={style}
        >
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
    );
}

export function AlertBadgeIcon({ size = 16, className = "", style = {} }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`svg-icon ${className}`}
            style={{ display: "inline-block", verticalAlign: "middle", ...style }}
        >
            <circle cx="12" cy="12" r="10" fill="#f85149" />
            <path d="M12 8v4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="#ffffff" />
        </svg>
    );
}

export function FlaskIcon({ size = 18, className = "", style = {} }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`svg-icon ${className}`}
            style={style}
        >
            <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55A1 1 0 0 0 5.607 22h12.786a1 1 0 0 0 .886-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
            <line x1="8.5" y1="2" x2="15.5" y2="2" />
            <line x1="7" y1="16" x2="17" y2="16" />
        </svg>
    );
}

export function CheckBadgeIcon({ size = 16, className = "", style = {} }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`svg-icon ${className}`}
            style={{ display: "inline-block", verticalAlign: "middle", ...style }}
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#25d366" />
            <polyline points="22 4 12 14.01 9 11.01" stroke="#25d366" />
        </svg>
    );
}
