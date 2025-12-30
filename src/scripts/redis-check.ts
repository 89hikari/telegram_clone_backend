import Redis from "ioredis";

async function main() {
  const host = process.env.REDIS_HOST ?? "127.0.0.1";
  const port = parseInt(process.env.REDIS_PORT ?? "6379", 10);

  const client = new Redis({ host, port });
  client.on("error", (err) => {
    // log and allow graceful handling in the try/catch below
    console.error("Redis client error:", err.message || err);
  });

  try {
    const pong = await client.ping();
    console.log(`Redis ping response: ${pong}`);
    await client.quit();
    process.exit(0);
  } catch (err) {
    console.error("Redis check failed:", err instanceof Error ? err.message : err);
    try {
      await client.quit();
    } catch (_) {
      // Ignore quit errors during error handling
    }
    process.exit(2);
  }
}

main();
