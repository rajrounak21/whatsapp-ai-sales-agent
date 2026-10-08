const mongoose = require("mongoose");

const userschema = new mongoose.Schema({
    accountId: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },

    passwordHash: {
        type: String,
        required: true
    },

    name: String,


})

module.exports = mongoose.model("User", userschema)