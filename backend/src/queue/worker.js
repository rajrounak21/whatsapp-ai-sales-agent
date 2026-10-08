const { Worker } = require("bullmq");
const processor = require("./processor");
const { createRedis } = require("./queue");

const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || 10);

const worker = new Worker("whatsapp-messages", processor, {
    connection: createRedis(),
    concurrency: WORKER_CONCURRENCY,
});

worker.on("completed", (job, result) =>
    console.log(`[WORKER] completed jobId=${job.id} leadId=${job.data.leadId} ${JSON.stringify(result)}`)
);
worker.on("failed", (job, err) =>
    console.error(`[WORKER] FAILED jobId=${job ? job.id : "?"} leadId=${job && job.data ? job.data.leadId : "?"}: ${err.message}`)
);
worker.on("error", (err) => console.error(`[WORKER] error: ${err.message}`));

console.log(`[WORKER] started concurrency=${WORKER_CONCURRENCY}`);

module.exports = worker;