import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { sendVerifyEmail } from "src/mailing";
import { UserResponseDto } from "../users/dto/user-response.dto";
import { UserDto } from "../users/user.dto";
import { UsersService } from "../users/users.service";
import { SignUpDto, VerifyEmailDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Sanitizes user data by removing sensitive fields
   * @param user - Raw user data
   * @returns User data without sensitive information
   */
  private sanitizeUserData(user: Partial<UserDto>): UserResponseDto {
    return {
      id: user.id as number,
      name: user.name as string,
      email: user.email as string,
      gender: user.gender as string,
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt,
      isValidated: user.isValidated as boolean,
    } as UserResponseDto;
  }

  /**
   * Validates user credentials
   * @param name - Username or email
   * @param pass - Plain text password
   * @returns Sanitized user data or null if invalid
   */
  public async validateUser(name: string, pass: string): Promise<UserResponseDto | null> {
    const user = await this.usersService.findOneByEmailOrName(name);
    if (!user) return null;

    const match = await this.comparePassword(pass, user.password);
    if (!match) return null;

    return this.sanitizeUserData(user as unknown as Partial<UserDto>);
  }

  /**
   * Verifies user email code and marks user as validated
   * @param verifyData - Verification code and user name
   * @returns Validated user data and JWT token
   */
  public async verifyUser(verifyData: VerifyEmailDto) {
    const user = await this.usersService.findOneByEmailOrName(verifyData.name);

    if (user !== null) {
      const isValidCode = await this.compareVerificationCode(verifyData.vfCode, user.verificationCode);
      if (isValidCode) {
        user.verificationCode = "";
        user.isValidated = true;
        await user.save();

        const result = this.sanitizeUserData(user as unknown as Partial<UserDto>);
        const token = await this.generateToken(result);

        return { user: result, token };
      }

      throw new ForbiddenException("Invalid code");
    }

    throw new NotFoundException("User not found");
  }

  /**
   * Checks if user email is verified
   * @param name - Username or email
   * @returns Boolean indicating verification status
   */
  public async checkVerification(name: string) {
    const user = await this.usersService.findOneByEmailOrName(name);
    return user?.isValidated || false;
  }

  /**
   * Logs in user and generates JWT token
   * @param incomingUser - User data from passport
   * @returns Sanitized user data and JWT token
   */
  public async login(incomingUser: UserDto) {
    const user = this.sanitizeUserData(incomingUser);
    const token = await this.generateToken(user);
    return { user, token };
  }

  /**
   * Creates new user with hashed password and verification code
   * @param user - New user data
   * @returns Created user data (without sensitive fields)
   * @throws ConflictException if user already exists
   */
  public async create(user: SignUpDto) {
    // delegate validation to AuthValidationService
    // lazy-require to avoid circular dependency at runtime
    const { AuthValidationService } = await import("./auth-validation.service");
    const validation = new AuthValidationService(this.usersService);
    await validation.assertUserNotExists(user.email, user.name);

    const verificationCode = sendVerifyEmail(user.email);
    const verificationHash = await this.hashVerificationCode(verificationCode);

    const newUser = await this.usersService.create({
      ...user,
      password: await this.hashPassword(user.password),
      isValidated: false,
      verificationCode: verificationHash,
    });

    return this.sanitizeUserData(newUser as unknown as Partial<UserDto>);
  }

  /**
   * Generates JWT token with only safe user data
   * @param user - User data to encode (should be sanitized)
   * @returns JWT token
   */
  private async generateToken(user: UserResponseDto) {
    return await this.jwtService.signAsync(user);
  }

  /**
   * Hashes a password
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string | Buffer) {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Compares entered password with database password
   * @param enteredPassword - Plain text password
   * @param dbPassword - Hashed password from database
   * @returns True if passwords match
   */
  private async comparePassword(enteredPassword: string | Buffer, dbPassword: string) {
    return await bcrypt.compare(enteredPassword, dbPassword);
  }

  /**
   * Hashes a verification code
   * @param code - Plain text verification code
   * @returns Hashed verification code
   */
  private async hashVerificationCode(code: string): Promise<string> {
    return await bcrypt.hash(code, 10);
  }

  /**
   * Compares entered verification code with database hash
   * @param enteredCode - Plain text verification code
   * @param dbCodeHash - Hashed verification code from database
   * @returns True if codes match
   */
  private async compareVerificationCode(enteredCode: string | undefined, dbCodeHash?: string): Promise<boolean> {
    if (!enteredCode || !dbCodeHash) return false;
    return await bcrypt.compare(enteredCode, dbCodeHash);
  }
}
