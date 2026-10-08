const mongoose = require("mongoose");

const messageschema = new mongoose.Schema({

    accountId: {
        type: String,
        required: true
    },

    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
        required: true
    },

    waMessageId: {
        type: String,
        required: true
    },

    direction: {
        type: String,
        enum: ["in", "out"],
        required: true
    },

    sender: {
        type: String,
        enum: ["lead", "ai", "fallback", "human"],
        required: true
    },

    text: {
        type: String,
        required: true
    },

    latencyMs: {
        type: Number,
    },



},
    { timestamps: { createdAt: true, updatedAt: false } });


messageschema.index({ waMessageId: 1 }, { unique: true });
messageschema.index({ accountId: 1, leadId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageschema);