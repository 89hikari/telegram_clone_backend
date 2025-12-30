import { registerAs } from "@nestjs/config";

export interface RedisConfig {
  host: string;
  port: number;
  ttl: number; // seconds
}

export default registerAs<RedisConfig>("redis", () => ({
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  ttl: parseInt(process.env.REDIS_TTL ?? "300", 10),
}));
