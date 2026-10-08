const jwt = require("jsonwebtoken");

function readCookie(req, name) {
    const raw = req.headers.cookie;
    if (!raw) return null;
    for (const part of raw.split(";")) {
        const eq = part.indexOf("=");
        if (eq === -1) continue;
        if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
    }
    return null;
}

// Verifies the JWT from Authorization: Bearer <token> or the httpOnly cookie.
// req.accountId is set ONLY from the token — never from body, params or headers.
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
    const token = bearer || readCookie(req, "token");
    if (!token) return res.sendStatus(401);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload || !payload.accountId) return res.sendStatus(401);
        req.user = { id: payload.sub, email: payload.email, name: payload.name };
        req.accountId = payload.accountId;
        next();
    } catch (err) {
        return res.sendStatus(401);
    }
}

module.exports = authMiddleware;
