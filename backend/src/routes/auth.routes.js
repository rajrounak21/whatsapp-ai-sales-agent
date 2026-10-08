const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Tenant = require("../models/Tenant");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

function signToken(user) {
    return jwt.sign(
        { sub: user._id.toString(), accountId: user.accountId, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
}

// POST /api/auth/login — the only public /api/ route
router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "invalid email or password" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid email or password" });

    const tenant = await Tenant.findOne({ accountId: user.accountId }).lean();
    const token = signToken(user);

    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, accountId: user.accountId },
        tenant: { accountId: user.accountId, businessName: tenant ? tenant.businessName : "" },
    });
});

// GET /api/auth/me — logged-in user + their tenant's business name
router.get("/me", authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.sendStatus(401);
    const tenant = await Tenant.findOne({ accountId: user.accountId }).lean();
    res.json({
        user: { id: user._id, name: user.name, email: user.email },
        tenant: { accountId: user.accountId, businessName: tenant ? tenant.businessName : "" },
    });
});

// POST /api/auth/logout — clears the cookie
router.post("/logout", authMiddleware, (req, res) => {
    res.clearCookie("token");
    res.json({ ok: true });
});

module.exports = router;
