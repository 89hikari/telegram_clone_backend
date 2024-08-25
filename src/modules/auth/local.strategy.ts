import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, pwd: string): Promise<any> {
    const user = await this.authService.validateUser(email, pwd);

    if (!user) {
      throw new UnauthorizedException('Invalid user credentials');
    }

    if (!user.is_validated) {
      throw new UnauthorizedException('User isnt validated');
    }

    const { verification_code, ...result } = user;
    return result;
  }
}
