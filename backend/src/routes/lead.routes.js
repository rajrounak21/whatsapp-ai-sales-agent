const express = require("express");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Message = require("../models/Message");
const Tenant = require("../models/Tenant");
const { saveReply } = require("../services/replyService");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();
router.use(authMiddleware); // every route below requires login


// GET /api/stats — Tenant analytics overview
router.get("/stats", async (req, res) => {
    const accountId = req.accountId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalLeads, aiRepliesToday, fallbackCount, latencyData] = await Promise.all([
        Lead.countDocuments({ accountId }),
        Message.countDocuments({ accountId, direction: "out", sender: "ai", createdAt: { $gte: startOfDay } }),
        Message.countDocuments({ accountId, direction: "out", sender: "fallback" }),
        Message.aggregate([
            { $match: { accountId, direction: "out", latencyMs: { $ne: null } } },
            { $group: { _id: null, avgLatency: { $avg: "$latencyMs" } } }
        ])
    ]);

    const avgReplySec = latencyData.length > 0 ? (latencyData[0].avgLatency / 1000).toFixed(1) : "0.0";

    res.json({
        totalLeads,
        aiRepliesToday,
        avgReplySec: `${avgReplySec}s`,
        fallbackCount
    });
});

// GET /api/leads — my tenant's leads, newest first, with last message preview
router.get("/leads", async (req, res) => {
    const accountId = req.accountId;

    const leads = await Lead.find({ accountId }).lean();

    // Latest message per lead (same tenant filter)
    const lastMsgs = await Message.aggregate([
        { $match: { accountId } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$leadId", text: { $first: "$text" }, at: { $first: "$createdAt" } } },
    ]);
    const byLead = new Map(lastMsgs.map((m) => [String(m._id), m]));

    // Unread = customer messages that arrived after the owner last opened this chat
    const unreadCounts = await Promise.all(
        leads.map((l) => {
            const filter = { accountId, leadId: l._id, direction: "in" };
            if (l.lastOpenedAt) filter.createdAt = { $gt: l.lastOpenedAt };
            return Message.countDocuments(filter);
        })
    );

    const items = leads.map((l, i) => {
        const last = byLead.get(String(l._id));
        return {
            leadId: l._id,
            name: l.name || "",
            phone: l.phone || "",
            status: l.status || "new",
            humanTakeover: !!l.humanTakeover,
            lastMessageText: last ? last.text : "",
            lastMessageAt: (last ? last.at : l.lastMessageAt) || null,
            unreadCount: unreadCounts[i],
        };
    });

    // Newest first — sorted by the same lastMessageAt we return
    items.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
    res.json(items);
});

// GET /api/leads/:leadId/messages — full chat, oldest first.
// Another tenant's lead id => 404 (it must not even appear to exist).
router.get("/leads/:leadId/messages", async (req, res) => {
    const { leadId } = req.params;
    if (!mongoose.isValidObjectId(leadId)) return res.sendStatus(404);

    const lead = await Lead.findOne({ _id: leadId, accountId: req.accountId }).lean();
    if (!lead) return res.sendStatus(404);

    const messages = await Message.find({ accountId: req.accountId, leadId: lead._id })
        .sort({ createdAt: 1, _id: 1 })
        .lean();

    // Opening the chat marks everything as read
    await Lead.updateOne({ _id: lead._id, accountId: req.accountId }, { $set: { lastOpenedAt: new Date() } });

    res.json({
        lead: {
            leadId: lead._id,
            name: lead.name || "",
            phone: lead.phone || "",
            status: lead.status || "new",
            humanTakeover: !!lead.humanTakeover,
        },
        messages: messages.map((m) => ({
            messageId: m._id,
            direction: m.direction,
            sender: m.sender,
            text: m.text,
            latencyMs: typeof m.latencyMs === "number" ? m.latencyMs : null,
            createdAt: m.createdAt,
        })),
    });
});

// PATCH /api/leads/:leadId/takeover — body { enabled: true/false } => AI off/on
router.patch("/leads/:leadId/takeover", async (req, res) => {
    const { leadId } = req.params;
    const { enabled } = req.body || {};
    if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be a boolean" });
    }
    if (!mongoose.isValidObjectId(leadId)) return res.sendStatus(404);

    const lead = await Lead.findOne({ _id: leadId, accountId: req.accountId });
    if (!lead) return res.sendStatus(404);

    lead.humanTakeover = enabled;
    await lead.save();

    res.json({ leadId: lead._id, humanTakeover: lead.humanTakeover });
});

// POST /api/leads/:leadId/reply — Human agent sends manual reply
router.post("/leads/:leadId/reply", async (req, res) => {
    const { leadId } = req.params;
    const { text } = req.body || {};

    if (!text || !text.trim()) {
        return res.status(400).json({ error: "Reply text is required" });
    }
    if (!mongoose.isValidObjectId(leadId)) return res.sendStatus(404);

    const lead = await Lead.findOne({ _id: leadId, accountId: req.accountId });
    if (!lead) return res.sendStatus(404);

    if (lead.humanTakeover !== true) {
        return res.status(400).json({ error: "Human reply is only allowed when AI is OFF (human takeover)" });
    }

    const tenant = await Tenant.findOne({ accountId: req.accountId });

    const waMessageId = await saveReply({
        lead,
        phoneNumberId: tenant?.phoneNumberId || "default",
        text: text.trim(),
        sender: "human",
        latencyMs: null
    });

    res.json({ success: true, waMessageId });
});

module.exports = router;
