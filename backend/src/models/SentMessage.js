const mongoose = require("mongoose");

const sentMessageSchema = new mongoose.Schema({

    accountId: { type: String, required: true },
    phoneNumberId: { type: String, required: true },
    to: { type: String, required: true },
    text: { type: String, required: true },
    replyToMessageId: String,
    sentAt: { type: Date, default: Date.now }
})

const SentMessage = mongoose.model("SentMessage", sentMessageSchema);
module.exports = SentMessage;

