import Redis from "ioredis";

describe("Redis integration", () => {
  let client: Redis | undefined;
  let redisAvailable = true;

  beforeAll(async () => {
    const host = process.env.REDIS_HOST ?? "127.0.0.1";
    const port = parseInt(process.env.REDIS_PORT ?? "6379", 10);

    client = new Redis({ host, port, maxRetriesPerRequest: 0, enableOfflineQueue: false, connectTimeout: 1000 });
    try {
      const pong = await client.ping();
      redisAvailable = pong === "PONG";
    } catch (e) {
      redisAvailable = false;
      try {
        client.disconnect();
      } catch (_) {
        // Ignore disconnect errors during connection failure
      }
      client = undefined;
    }
  });

  afterAll(async () => {
    if (!client) return;
    try {
      await client.quit();
    } catch (_) {
      try {
        client.disconnect();
      } catch (_) {
        // Ignore disconnect errors during cleanup
      }
    }
  });

  it("should ping and set/get a key", async () => {
    if (!redisAvailable || !client) {
      // Redis not available locally — skip test
      console.warn("Redis not available, skipping redis.integration test");
      return;
    }

    const pong = await client.ping();
    expect(pong).toBe("PONG");

    await client.set("jest:redis:test", "ok", "EX", 10);
    const value = await client.get("jest:redis:test");
    expect(value).toBe("ok");
    await client.del("jest:redis:test");
  });
});
