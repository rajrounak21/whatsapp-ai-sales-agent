const Message = require("../models/Message");
const { sendWhatsAppMessage } = require("./whatsappSender");

const HISTORY_BATCH = Number(process.env.HISTORY_BATCH || 10);

async function getUnrepliedBatch({ accountId, leadId }) {
    const lastOut = await Message.findOne({ accountId, leadId, direction: "out" })
        .sort({ createdAt: -1 })
        .lean();

    const filter = { accountId, leadId, direction: "in" };
    if (lastOut) filter.createdAt = { $gt: lastOut.createdAt };

    const batch = await Message.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(HISTORY_BATCH)
        .lean();
    batch.reverse();
    return batch;
}

async function saveReply({ lead, phoneNumberId, text, sender, latencyMs, replyToWaMessageId }) {
    const waMessageId = `out_${lead._id}_${Date.now()}`;
    await Message.create({
        accountId: lead.accountId,
        leadId: lead._id,
        waMessageId,
        direction: "out",
        sender,
        text,
        latencyMs,
    });
    try {
        await sendWhatsAppMessage({
            accountId: lead.accountId,
            phoneNumberId,
            to: lead.phone,
            text,
            replyToMessageId: replyToWaMessageId,
        });
    } catch (err) {
        // Reply already saved in Mongo — send failure must not fail the job
        console.error(`[REPLY] send failed for outId=${waMessageId}: ${err.message}`);
    }
    return waMessageId;
}

module.exports = { getUnrepliedBatch, saveReply };