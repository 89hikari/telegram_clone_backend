import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "./auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: "name" });
  }

  async validate(name: string, pwd: string): Promise<Record<string, unknown>> {
    const user = await this.authService.validateUser(name, pwd);

    if (!user) {
      throw new UnauthorizedException("Invalid user credentials");
    }

    if (!user.is_validated) {
      throw new ForbiddenException("User isnt validated");
    }

    const result = { ...(user as Record<string, unknown>) } as Record<string, unknown>;
    delete result.verification_code;
    return result as Record<string, unknown>;
  }
}
