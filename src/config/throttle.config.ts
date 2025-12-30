import { registerAs } from "@nestjs/config";

export interface ThrottleConfig {
  ttl: number; // seconds
  limit: number; // requests per ttl
}

export default registerAs<ThrottleConfig>("throttle", () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? "60", 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? "5", 10),
}));
