const Lead = require("../models/Lead");
const Tenant = require("../models/Tenant");
const { callAgent } = require("../services/agentClient");
const { getUnrepliedBatch, saveReply } = require("../services/replyService");

const FALLBACK_TEXT =
    process.env.FALLBACK_TEXT ||
    "Thanks for your message! Our team will get back to you shortly.";

async function processor(job) {
    const { accountId, leadId } = job.data;

    const lead = await Lead.findOne({ _id: leadId, accountId });
    if (!lead) {
        console.log(`[WORKER] accountId=${accountId} leadId=${leadId} lead not found, skipping`);
        return { skipped: "lead_not_found" };
    }
    if (lead.humanTakeover === true) {
        console.log(`[WORKER] accountId=${accountId} leadId=${leadId} AI OFF (human takeover), no reply`);
        return { skipped: "human_takeover" };
    }

    const batch = await getUnrepliedBatch({ accountId, leadId: lead._id });
    if (!batch.length) {
        console.log(`[WORKER] accountId=${accountId} leadId=${leadId} no unreplied messages, skipping`);
        return { skipped: "no_messages" };
    }

    const lastMsg = batch[batch.length - 1];

    const tenant = await Tenant.findOne({ accountId }).lean();
    if (!tenant) throw new Error(`tenant not found for accountId=${accountId}`);

    let result;
    try {
        result = await callAgent({ accountId, leadId, waMessageId: lastMsg.waMessageId, text: lastMsg.text });
    } catch (err) {
        console.error(`[WORKER] AGENT FAILED leadId=${leadId} waMessageId=${lastMsg.waMessageId}: ${err.message}`);
        result = { replyText: FALLBACK_TEXT, sender: "fallback", llmMs: 0 };
    }

    // R9: first unreplied inbound -> reply saved (debounce + agent time included)
    const latencyMs = Date.now() - new Date(batch[0].createdAt).getTime();

    const outId = await saveReply({
        lead,
        phoneNumberId: tenant.phoneNumberId,
        text: result.replyText,
        sender: result.sender,
        latencyMs,
        replyToWaMessageId: lastMsg.waMessageId,
    });

    console.log(
        `[WORKER] accountId=${accountId} leadId=${leadId} waMessageId=${lastMsg.waMessageId} ` +
        `outId=${outId} sender=${result.sender} batch=${batch.length} latencyMs=${latencyMs} agentMs=${result.llmMs}`
    );
    return { ok: true, sender: result.sender, batch: batch.length };
}

module.exports = processor;