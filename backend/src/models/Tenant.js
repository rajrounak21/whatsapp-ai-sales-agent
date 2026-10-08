const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
    accountId: {
        type: String,
        required: true,
        unique: true
    },
    businessName: {
        type: String,
        required: true,

    },

    phoneNumberId: {
        type: String,
        required: true,
        unique: true,

    },

    tone: String,
    language: String,
    pricing: String,
    faqs: [{ q: String, a: String }]

})


module.exports = mongoose.model("Tenant", tenantSchema);