require("dotenv").config();
const Redis = require("ioredis");

const connectRedisDb = async () => {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error("Redis URL is not provided.");
    }

    console.log("Redis DB is connected.");
    const client = await new Redis(process.env.REDIS_URL);
    return client;
  } catch (error: any) {
    throw new Error("Failed to connect to Redis database: " + error.message);
  }
};

// Example usage:
// (async () => {
//   const client = connectRedisDb();
//   await client.set("foo", "bar");
//   const x = await client.get("foo");
//   console.log(x); // Output: bar
// })();

module.exports = { connectRedisDb };
