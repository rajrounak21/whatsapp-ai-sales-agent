const express = require("express");
const Tenant = require("../models/Tenant");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Disabled in production — the route does not even exist there
router.use((req, res, next) => {
    if (process.env.NODE_ENV === "production") return res.sendStatus(404);
    next();
});
router.use(authMiddleware);

// POST /api/dev/simulate-message — body { leadPhone, leadName, text }.
// Builds a Meta-format payload with MY tenant's phone_number_id and posts it
// to our own webhook, so the message goes through the full webhook -> queue ->
// worker path (never skips it).
router.post("/simulate-message", async (req, res) => {
    const { leadPhone, leadName, text } = req.body || {};
    if (!leadPhone || !text) {
        return res.status(400).json({ error: "leadPhone and text are required" });
    }

    const tenant = await Tenant.findOne({ accountId: req.accountId }).lean();
    if (!tenant) return res.sendStatus(404);

    const payload = {
        object: "whatsapp_business_account",
        entry: [{
            id: "WABA_ID",
            changes: [{
                field: "messages",
                value: {
                    messaging_product: "whatsapp",
                    metadata: { phone_number_id: tenant.phoneNumberId },
                    contacts: [{ profile: { name: leadName || "Unknown" }, wa_id: String(leadPhone) }],
                    messages: [{
                        from: String(leadPhone),
                        id: `wamid.dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                        timestamp: String(Math.floor(Date.now() / 1000)),
                        type: "text",
                        text: { body: String(text) },
                    }],
                },
            }],
        }],
    };

    const webhookUrl = process.env.WEBHOOK_URL || "http://localhost:4000/webhook/whatsapp";
    const startedAt = Date.now();
    const whRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    res.json({ ok: whRes.ok, status: whRes.status, ms: Date.now() - startedAt });
});

module.exports = router;
