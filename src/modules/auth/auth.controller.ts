import { Body, Controller, Get, Post, Query, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { SignUpDto, VerifyEmailDto } from "./dto/auth.dto";

@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login with username/email and password
   * Rate limited: max 5 attempts per 60 seconds
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard("local"))
  @Post("login")
  async login(@Request() { user }) {
    return await this.authService.login(user);
  }

  /**
   * Register new user with email verification
   * Rate limited: max 3 signups per 60 seconds
   */
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("signup")
  async signUp(@Body() user: SignUpDto) {
    return await this.authService.create(user);
  }

  /**
   * Verify email with verification code
   * Rate limited: max 5 attempts per 60 seconds
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("verify")
  async verify(@Body() verifyData: VerifyEmailDto) {
    return await this.authService.verifyUser(verifyData);
  }

  /**
   * Check if user email is verified
   * Rate limited: max 10 checks per 60 seconds
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get("check-verification")
  async checkVerification(@Query("name") name: string) {
    return await this.authService.checkVerification(name);
  }
}
