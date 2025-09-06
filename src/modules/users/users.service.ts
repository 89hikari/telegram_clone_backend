import { Inject, Injectable } from "@nestjs/common";
import { literal, Op } from "sequelize";
import { UserDto } from "./user.dto";
import { User } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(@Inject("USER_REPOSITORY") private readonly userRepository: typeof User) {}

  async create(user: UserDto): Promise<User> {
    return await this.userRepository.create<User>(user);
  }

  async setLastSeen(id?: number): Promise<void> {
    id && await this.userRepository.update<User>(
      {
        lastSeenAt: new Date(),
      },
      {
        where: {
          id,
        },
      },
    );
  }

  async findList(limit: number, search: string, userId: number) {
    return await this.userRepository.findAll<User>({
      where: {
        name: {
          [Op.like]: `%${search || ""}%`,
        },
        [Op.not]: {
          id: userId,
        },
      },
      limit: limit || 5,
      attributes: ["id", "name", "email"],
    });
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne<User>({ where: { email } });
  }

  async findOneByEmailOrName(emailOrName: string): Promise<User> {
    return await this.userRepository.findOne<User>({
      where: { [Op.or]: [{ name: emailOrName }, { email: emailOrName }] },
    });
  }

  async findOneById(id: number): Promise<User> {
    return await this.userRepository.findOne<User>({
      where: {
        id,
      },
      attributes: [
        "id",
        "name",
        "email",
        "gender",
        "createdAt",
        "lastSeenAt",
        [literal("avatar IS NOT NULL"), "hasAvatar"],
      ],
    });
  }

  async updateAvatar(id: number, file: Express.Multer.File) {
    await this.userRepository.update<User>(
      { avatar: file.buffer },
      {
        where: {
          id,
        },
      },
    );
  }

  async getAvatar(id: number): Promise<Buffer | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      attributes: ["avatar"],
    });

    return user?.avatar ?? null;
  }
}
