import Queue from "bull";

const emailQueue = new Queue("email", {
  redis: { host: "172.28.192.161", port: 6379 },
});

emailQueue.on("ready", () => {
  console.log("Redis is connected and queue is ready");
});
emailQueue.on("error", (error) => {
  console.error("Redis or Bull error:", error);
});

emailQueue.on("waiting", (jobId) => {
  console.log(`Job ${jobId} is waiting to be processed`);
});

emailQueue.on("active", (job, jobPromise) => {
  console.log(`Job ${job.id} is now active`);
});

emailQueue.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed! Result: ${result}`);
});

emailQueue.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`);
});
