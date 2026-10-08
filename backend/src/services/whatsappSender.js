const SentMessage = require("../models/SentMessage");

async function sendWhatsAppMessage({ accountId, phoneNumberId, to, text, replyToMessageId }) {
    if (process.env.WHATSAPP_MODE === "mock") {
        await SentMessage.create({ accountId, phoneNumberId, to, text, replyToMessageId });
        console.log(`[MOCK SEND] ${phoneNumberId} -> ${to}: ${text}`);
        return;
    }
    throw new Error(`WHATSAPP_MODE=${process.env.WHATSAPP_MODE} not supported yet`);
}

module.exports = { sendWhatsAppMessage };