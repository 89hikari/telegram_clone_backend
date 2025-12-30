import { registerAs } from "@nestjs/config";

export interface AuthConfig {
  jwtSecret: string;
  tokenExpiration: string;
}

export default registerAs<AuthConfig>("auth", () => ({
  jwtSecret: process.env.JWTKEY ?? "",
  tokenExpiration: process.env.TOKEN_EXPIRATION ?? "1d",
}));
