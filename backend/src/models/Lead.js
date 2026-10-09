const mongoose = require("mongoose");

const leadschema = new mongoose.Schema({

    accountId: {
        type: String,
        required: true,

    },

    phone: {
        type: String,
        required: true
    },

    name: String,

    status: {
        type: String,
        default: "new",
    },
    humanTakeover: { type: Boolean, default: false },

    lastMessageAt: {
        type: Date
    },

    lastOpenedAt: {
        type: Date
    }


});

leadschema.index({ accountId: 1, phone: 1 },
    { unique: true }
);

leadschema.index({ accountId: 1, lastMessageAt: 1 });

module.exports = mongoose.model("Lead", leadschema);