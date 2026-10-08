const { Queue, QueueEvents } = require("bullmq");
const IORedis = require("ioredis");

function createRedis() {
    return new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
}

const DEBOUNCE_MS = Number(process.env.DEBOUNCE_MS || 3000);

const messageQueue = new Queue("whatsapp-messages", { connection: createRedis() });
const queueEvents = new QueueEvents("whatsapp-messages", { connection: createRedis() });

queueEvents.on("deduplicated", ({ jobId, deduplicationId, deduplicatedJobId }) => {
    console.log(`[QUEUE] deduplicated job=${deduplicatedJobId} merged into existing=${jobId} dedupId=${deduplicationId}`);
});

queueEvents.on("stalled", ({ jobId }) => {
    console.warn(`[QUEUE] stalled jobId=${jobId}`);
});

module.exports = { messageQueue, queueEvents, createRedis, DEBOUNCE_MS };