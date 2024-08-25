import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SEND_VERIFY_EMAIL } from 'src/mailing';
import { UserDto } from '../users/user.dto';
import { UsersService } from '../users/users.service';
import { VerifyDTO } from './verification.model';

const bcrypt = require('bcrypt');

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    // find if user exist with this email
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      return null;
    }

    // find if user password match
    const match = await this.comparePassword(pass, user.password);
    if (!match) {
      return null;
    }

    // tslint:disable-next-line: no-string-literal
    const { password, ...result } = user['dataValues'];
    return result;
  }

  public async verifyUser(verifyData: VerifyDTO) {
    const user = await this.userService.findOneByEmail(verifyData.email);

    if (user !== null) {
      if (bcrypt.hashSync(verifyData.vf_code, process.env.VFCODE_SALT) === user.verification_code) {
        user.verification_code = '';
        user.is_validated = true;
        user.save();

        const { password, verification_code, ...result } = user['dataValues'];

        const token = await this.generateToken(result);

        return { user: result, token: token };
      }

      throw 'Invalid code';
    }

    throw 'User not found';
  }

  public async login(user) {
    const token = await this.generateToken(user);
    return { user, token };
  }

  public async create(user: UserDto) {
    // hash the password
    const pass = await this.hashPassword(user.password);

    const checkIfExist = await this.userService.findOneByEmail(user.email);

    if (checkIfExist === null) {
      // create the user
      const newUser = await this.userService.create({
        ...user,
        password: pass,
        is_validated: false,
        verification_code: SEND_VERIFY_EMAIL(user.email),
      });

      const { password, verification_code, ...result } = newUser['dataValues'];

      // return the user
      return result;
    }

    throw 'Already exists';
  }

  private async generateToken(user) {
    const token = await this.jwtService.signAsync(user);
    return token;
  }

  private async hashPassword(password: string | Buffer) {
    const hash = await bcrypt.hash(password, 10);
    return hash;
  }

  private async comparePassword(enteredPassword: string | Buffer, dbPassword: string) {
    const match = await bcrypt.compare(enteredPassword, dbPassword);
    return match;
  }
}
