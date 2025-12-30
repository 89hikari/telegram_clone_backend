import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";

interface JwtPayload {
  id: number;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWTKEY,
    });
  }
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOneById(payload.id as number);
    if (!user) {
      throw new UnauthorizedException("You are not authorized to perform the operation");
    }
    return payload;
  }
}
