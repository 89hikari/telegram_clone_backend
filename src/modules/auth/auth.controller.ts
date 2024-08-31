import { Body, Controller, Get, Post, Query, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserDto } from "../users/user.dto";
import { AuthService } from "./auth.service";
import { VerifyDTO } from "./verification.model";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard("local"))
  @Post("login")
  async login(@Request() { user }) {
    return await this.authService.login(user);
  }

  @Post("signup")
  async signUp(@Body() user: UserDto) {
    return await this.authService.create(user);
  }

  @Post("verify")
  async verify(@Body() verifyData: VerifyDTO) {
    return await this.authService.verifyUser(verifyData);
  }

  @Get("check-verification")
  async checkVerification(@Query("name") name: string) {
    return await this.authService.checkVerification(name);
  }
}
