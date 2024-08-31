import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { sendVerifyEmail } from "src/mailing";
import { UserDto, UserInsensitiveDTO } from "../users/user.dto";
import { UsersService } from "../users/users.service";
import { VerifyDTO } from "./verification.model";

const bcrypt = require("bcrypt");

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private getInsensitiveUserData(user: UserDto) {
    const { password, verification_code, is_validated, ...result } = user;
    return result;
  }

  public async validateUser(name: string, pass: string) {
    const user = await this.userService.findOneByEmailOrName(name);
    if (!user) return null;

    const match = await this.comparePassword(pass, user.password);
    if (!match) return null;

    const { password, ...result } = user["dataValues"];
    return result;
  }

  public async verifyUser(verifyData: VerifyDTO) {
    const user = await this.userService.findOneByEmailOrName(verifyData.name);

    if (user !== null) {
      if (verifyData.vfCode?.toLowerCase() === user.verification_code?.toLowerCase()) {
        user.verification_code = "";
        user.is_validated = true;
        user.save();

        const result = this.getInsensitiveUserData(user["dataValues"]);
        const token = await this.generateToken(result);

        return { user: result, token: token };
      }

      throw new ForbiddenException("Invalid code");
    }

    throw new NotFoundException("User not found");
  }

  public async checkVerification(name: string) {
    const user = await this.userService.findOneByEmailOrName(name);
    return user?.is_validated;
  }

  public async login(incomingUser: UserDto) {
    const user = this.getInsensitiveUserData(incomingUser);
    const token = await this.generateToken(user);
    return { user, token };
  }

  public async create(user: UserDto) {
    const checkIfExist =
      (await this.userService.findOneByEmailOrName(user.email)) ||
      (await this.userService.findOneByEmailOrName(user.name));

    if (checkIfExist === null) {
      const newUser = await this.userService.create({
        ...user,
        password: await this.hashPassword(user.password),
        is_validated: false,
        verification_code: sendVerifyEmail(user.email),
      });

      return this.getInsensitiveUserData(newUser["dataValues"]);
    }

    throw new ConflictException("Already exists");
  }

  private async generateToken(user: UserDto | UserInsensitiveDTO) {
    return await this.jwtService.signAsync(user);
  }

  private async hashPassword(password: string | Buffer) {
    return await bcrypt.hash(password, 10);
  }

  private async comparePassword(enteredPassword: string | Buffer, dbPassword: string) {
    return await bcrypt.compare(enteredPassword, dbPassword);
  }
}
