import { ConflictException, Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthValidationService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Ensures there is no existing user with same email or name.
   * Throws ConflictException if a user already exists.
   */
  async assertUserNotExists(email: string, name: string): Promise<void> {
    const byEmail = await this.usersService.findOneByEmailOrName(email);
    const byName = await this.usersService.findOneByEmailOrName(name);

    if (byEmail || byName) {
      throw new ConflictException("User with this email or username already exists");
    }
  }

  /**
   * Convenience wrapper to find user by email or name
   */
  async findOneByEmailOrName(emailOrName: string) {
    return await this.usersService.findOneByEmailOrName(emailOrName);
  }
}
