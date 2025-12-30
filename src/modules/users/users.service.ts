import { Injectable, Logger } from "@nestjs/common";
import { literal, Op } from "sequelize";
import { UserDto } from "./user.dto";
import { User } from "./user.entity";
import { UsersCacheService } from "./users-cache.service";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersCacheService: UsersCacheService,
  ) {}

  /**
   * Creates a new user in the database
   * @param user - User data to create
   * @returns Created user
   */
  async create(user: UserDto): Promise<User> {
    return await this.usersRepository.create(user);
  }

  /**
   * Updates user's last seen timestamp
   * @param id - User ID
   */
  async setLastSeen(id?: number): Promise<void> {
    if (id) {
      await this.usersRepository.update(
        {
          lastSeenAt: new Date(),
        },
        {
          where: {
            id,
          },
        },
      );
      try {
        await this.usersCacheService.delById(id);
      } catch (e) {
        this.logger.warn(`Failed to invalidate cache for setLastSeen ${id}`);
      }
    }
  }

  /**
   * Finds users by name search, excluding the requesting user
   * @param limit - Maximum number of results
   * @param search - Search query string
   * @param userId - ID of requesting user to exclude
   * @returns Array of matching users
   */
  async findList(limit: number, search: string, userId: number) {
    return await this.usersRepository.findAll({
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

  /**
   * Finds a single user by email address
   * @param email - Email address to search
   * @returns User if found, null otherwise
   */
  async findOneByEmail(email: string): Promise<User> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Finds a single user by email or username
   * @param emailOrName - Email or username to search
   * @returns User if found, null otherwise
   */
  async findOneByEmailOrName(emailOrName: string): Promise<User> {
    const lookupKey = emailOrName.toLowerCase();
    try {
      const cached = await this.usersCacheService.getByLookup<User>(lookupKey);
      if (cached) return cached as unknown as User;
    } catch (e) {
      this.logger.warn(`Cache lookup failed for ${lookupKey}`);
    }

    const user = await this.usersRepository.findOne({
      where: { [Op.or]: [{ name: emailOrName }, { email: emailOrName }] },
    });

    if (user) {
      const plain = user.get
        ? (user.get({ plain: true }) as unknown as Record<string, unknown>)
        : (user as unknown as Record<string, unknown>);
      try {
        await this.usersCacheService.setByLookup(lookupKey, plain);
        await this.usersCacheService.setById(plain.id as number, plain);
      } catch (e) {
        this.logger.warn(`Failed to set cache for user ${lookupKey}`);
      }
    }

    return user;
  }

  /**
   * Finds a single user by ID with selected attributes
   * @param id - User ID
   * @returns User with public attributes including last seen and avatar status
   */
  async findOneById(id: number): Promise<User> {
    const cacheKeyId = id;
    try {
      const cached = await this.usersCacheService.getById<Record<string, unknown>>(cacheKeyId);
      if (cached) return cached as unknown as User;
    } catch (e) {
      this.logger.warn(`Cache get failed for id ${id}`);
    }

    const user = await this.usersRepository.findOne({
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

    if (user) {
      const plain = user.get
        ? (user.get({ plain: true }) as unknown as Record<string, unknown>)
        : (user as unknown as Record<string, unknown>);
      try {
        await this.usersCacheService.setById(cacheKeyId, plain);
        // also set lookup cache for email and name
        if (plain.email) await this.usersCacheService.setByLookup(plain.email as string, plain);
        if (plain.name) await this.usersCacheService.setByLookup(plain.name as string, plain);
      } catch (e) {
        this.logger.warn(`Failed to set cache for user id ${id}`);
      }
    }

    return user;
  }

  /**
   * Updates user's avatar
   * @param id - User ID
   * @param file - Uploaded file with buffer
   */
  async updateAvatar(id: number, file: Express.Multer.File) {
    await this.usersRepository.update(
      { avatar: file.buffer },
      {
        where: {
          id,
        },
      },
    );
    try {
      await this.usersCacheService.delById(id);
      // try to fetch email/name to invalidate lookup entries too
      const u = await this.usersRepository.findOne({ where: { id }, attributes: ["email", "name"] });
      if (u) {
        const plain = u.get
          ? (u.get({ plain: true }) as unknown as Record<string, unknown>)
          : (u as unknown as Record<string, unknown>);
        if (plain.email) await this.usersCacheService.delByLookup(plain.email as string);
        if (plain.name) await this.usersCacheService.delByLookup(plain.name as string);
      }
    } catch (e) {
      this.logger.warn(`Failed to invalidate cache for user ${id}`);
    }
  }

  /**
   * Retrieves user's avatar
   * @param id - User ID
   * @returns Avatar buffer or null if not exists
   */
  async getAvatar(id: number): Promise<Buffer | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      attributes: ["avatar"],
    });

    return user?.avatar ?? null;
  }
}
