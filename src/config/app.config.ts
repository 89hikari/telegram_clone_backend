import { registerAs } from "@nestjs/config";

export interface AppConfig {
  port: number;
  globalPrefix: string;
  corsOrigins: string[];
}

const sanitizeOrigins = (originsRaw?: string): string[] => {
  if (!originsRaw) {
    return ["http://localhost:3000"];
  }

  return originsRaw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export default registerAs<AppConfig>("app", () => ({
  port: parseInt(process.env.PORT ?? "5000", 10),
  globalPrefix: process.env.API_PREFIX ?? "/vue-chat/api",
  corsOrigins: sanitizeOrigins(process.env.CORS_ORIGINS),
}));
