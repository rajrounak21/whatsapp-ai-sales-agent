const express = require("express");
const Tenant = require("../models/Tenant");
const Lead = require("../models/Lead");
const Message = require("../models/Message");
const { messageQueue, DEBOUNCE_MS } = require("../queue/queue");

const router = express.Router();

// Tenants are a tiny static collection — cache by phoneNumberId (60s TTL)
// so the hot path skips a Mongo roundtrip under parallel webhook bursts.
const tenantCache = new Map();
const TENANT_CACHE_MS = 60_000;

async function getTenant(phoneNumberId) {
    const hit = tenantCache.get(phoneNumberId);
    if (hit && hit.expiresAt > Date.now()) return hit.tenant;
    const tenant = await Tenant.findOne({ phoneNumberId });
    tenantCache.set(phoneNumberId, { tenant, expiresAt: Date.now() + TENANT_CACHE_MS });
    return tenant;
}

router.post("/webhook/whatsapp", async (req, res) => {
    const start = Date.now();

    try {
        // 1. Validate + extract Meta-format payload
        const change = req.body?.entry?.[0]?.changes?.[0]?.value;
        const msg = change?.messages?.[0];
        if (!msg || msg.type !== "text") {
            return res.sendStatus(200); // ignore images/status updates, still 200
        }
        const phoneNumberId = change?.metadata?.phone_number_id;
        const waMessageId = msg.id;
        const from = msg.from;
        const text = msg.text.body;
        const leadName = change?.contacts?.[0]?.profile?.name || "Unknown";
        if (!from) return res.sendStatus(200); // malformed payload — no sender

        // 2. Find tenant ONLY from phone_number_id — never from body/URL/text
        const tenant = await getTenant(phoneNumberId);
        if (!tenant) {
            console.warn(`[WEBHOOK] Unknown phone_number_id=${phoneNumberId}, ignoring`);
            return res.sendStatus(200);
        }

        // 3. Lead: insert-first fast path — new lead = one index write (no
        //    findOneAndUpdate read+write); existing lead = E11000 -> lookup.
        let tPhase = Date.now();
        let leadId;
        try {
            const ins = await Lead.collection.insertOne({
                accountId: tenant.accountId,
                phone: from,
                name: leadName,
                status: "new",
                humanTakeover: false,
                lastMessageAt: new Date(),
            });
            leadId = ins.insertedId;
        } catch (err) {
            if (err && (err.code === 11000 || err.codeName === "DuplicateKey")) {
                const ex = await Lead.collection.findOne(
                    { accountId: tenant.accountId, phone: from },
                    { projection: { _id: 1 } }
                );
                if (!ex) throw err;
                leadId = ex._id;
                Lead.collection.updateOne({ _id: leadId }, { $set: { lastMessageAt: new Date() } }).catch(() => {});
            } else {
                throw err;
            }
        }
        const tUpsert = Date.now() - tPhase;
        tPhase = Date.now();

        // 4+5. Save incoming message AND enqueue the debounced ticket in parallel —
        //      both only need leadId (already have it). The unique index on
        //      waMessageId IS the duplicate check: replayed webhook => E11000 => skip.
        const savePromise = (async () => {
            try {
                await Message.collection.insertOne({
                    accountId: tenant.accountId,
                    leadId,
                    waMessageId,
                    direction: "in",
                    sender: "lead",
                    text,
                    createdAt: new Date(),
                });
                return true;
            } catch (err) {
                if (err && (err.code === 11000 || err.codeName === "DuplicateKey")) {
                    console.log(`[WEBHOOK] Duplicate ${waMessageId} skipped`);
                    return false;
                }
                throw err;
            }
        })();

        // ONE debounced ticket per lead — Rounak ke 5 messages = 1 job = 1 LLM call
        //    messages already saved in step 4 (Mongo = source of truth)
        const addPromise = messageQueue.add(
            "handle-message",
            { accountId: tenant.accountId, leadId: leadId.toString() },
            {
                delay: DEBOUNCE_MS,
                deduplication: {
                    id: `lead-${leadId}`,
                    ttl: DEBOUNCE_MS,
                    extend: true,
                    replace: true,
                    keepLastIfActive: true,
                },
                removeOnComplete: true,
                removeOnFail: 5000,
                attempts: 3,
                backoff: { type: "exponential", delay: 2000 },
            }
        );

        const [saved] = await Promise.all([savePromise, addPromise]);
        const tCreate = Date.now() - tPhase;
        console.log(`[WEBHOOK] ${waMessageId} lead=${leadId} account=${tenant.accountId} ${Date.now() - start}ms (upsert=${tUpsert} save+add=${tCreate})`);
        return res.sendStatus(200);
    } catch (err) {
        // Even on error, answer Meta with 200 (except programming errors you should see)
        console.error(`[WEBHOOK] Error (still returning 200):`, err.message);
        return res.sendStatus(200);
    }
});

module.exports = router;