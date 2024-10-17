require("dotenv").config();
const Redis = require("ioredis");

export const redisDB = async () => {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error("Redis URL is not provided.");
    }
    const client = await new Redis(process.env.REDIS_URL);
    return { client };
  } catch (error: any) {
    throw new Error("Failed to connect to Redis database: " + error.message);
  }
};
