require("dotenv").config();
const Redis = require("ioredis");

const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is missing");
  }

  // Initialize Redis with the URL and TLS options
  const redis = new Redis(redisUrl, {
    tls: { rejectUnauthorized: false },
    debug: true, // Enable debug logging if needed
  });

  redis.on("connect", () => {
    console.log("Redis is connected successfully");
  });

  redis.on("error", (error: any) => {
    console.error("Redis connection error:", error.message);
  });

  return redis;
};

// Export the Redis client instance
module.exports = createRedisClient;
