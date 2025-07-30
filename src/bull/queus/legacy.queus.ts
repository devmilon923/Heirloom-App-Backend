import Bull from "bull";
import { Types } from "mongoose";
import { BullProssess } from "../prossess/prossess";

const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => Math.min(times * 500, 10000),
  },
};

const legacyQueue = new Bull("legacyQueue", redisConfig);

// Connection event listeners
legacyQueue.on("error", (error) => {
  console.error("🔴 Redis connection error:", error.message);
});

legacyQueue.on("ready", () => {
  console.log("🟢 Redis connection established");
});

legacyQueue.on("failed", (job, error) => {
  console.error(`🔴 Job ${job?.id || "unknown"} failed:`, error.message);
});

legacyQueue.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

// Process jobs
legacyQueue.process(5, BullProssess.triggerlagacyQueue);

const triggerLegacyQueue = async ({
  recipients,
  legacyId,
  delay,
}: {
  recipients: Types.ObjectId[];
  legacyId: Types.ObjectId;
  delay: number;
}) => {
  try {
    const job = await legacyQueue.add(
      {
        recipients,
        legacyId,
      },
      {
        attempts: 3,
        delay,
        backoff: 5000,
        removeOnComplete: true,
      }
    );

    return job
      .finished()
      .then(() => {
        console.log(`🚀 Job ${job.id} processed successfully`);
        return { status: "completed", jobId: job.id };
      })
      .catch((error) => {
        console.error(`🔥 Job ${job.id} failed processing:`, error.message);
        return { status: "failed", jobId: job.id, error: error.message };
      });
  } catch (addError: any) {
    console.error("❌ Failed to add job to queue:", addError.message);
    return { status: "add-failed", error: addError.message };
  }
};

// Connection health check
const checkRedisConnection = async () => {
  try {
    const client = legacyQueue.client;
    const pong = await client.ping();
    return pong === "PONG";
  } catch (error: any) {
    console.error("🔴 Redis connection check failed:", error.message);
    return false;
  }
};

// Periodically check connection
// setInterval(async () => {
//   const isAlive = await checkRedisConnection();
//   console.log(
//     `[${new Date().toISOString()}] Redis connection:`,
//     isAlive ? "🟢 ALIVE" : "🔴 DEAD"
//   );
// }, 30000); // Check every 30 seconds

// Initial connection check
checkRedisConnection().then((connected) => {
  console.log(connected);
  console.log(
    `Initial Redis connection: ${connected ? "🟢 SUCCESS" : "🔴 FAILED"}`
  );
});

export const LegacyQueues = {
  triggerLegacyQueue,
  checkRedisConnection,
};
