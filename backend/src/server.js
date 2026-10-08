require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const webhookRoutes = require("./routes/webhook.routes");
const authRoutes = require("./routes/auth.routes");
const leadRoutes = require("./routes/lead.routes");
const devRoutes = require("./routes/dev.routes");

async function start() {
    await connectDB();
    require("./queue/worker");
    const app = express();
    app.use(express.json());
    app.use(webhookRoutes);

    app.get("/health", (req, res) => res.json({ ok: true }));

    // Dashboard APIs — every /api/* route except login runs auth.middleware
    // (login/me/logout own the middleware inside auth.routes; lead routes and
    // dev routes apply it themselves, req.accountId always comes from the token)
    app.use("/api/auth", authRoutes);
    app.use("/api", leadRoutes);
    app.use("/api/dev", devRoutes);

    app.listen(process.env.PORT || 4000, () =>
        console.log(`[SERVER] Express on :${process.env.PORT || 4000}`)
    );
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});