import { Inject, Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { UserDto } from './user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@Inject('USER_REPOSITORY') private readonly userRepository: typeof User) {}

  async create(user: UserDto): Promise<User> {
    return await this.userRepository.create<User>(user);
  }

  async findList(limit: number, search: string, userId: number) {
    return await this.userRepository.findAll<User>({
      where: {
        name: {
          [Op.like]: `%${search || ''}%`,
        },
        [Op.not]: {
          id: userId,
        },
      },
      limit: limit || 5,
      attributes: ['id', 'name', 'email'],
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
        id: id,
      },
      attributes: ['id', 'name', 'email'],
    });
  }
}
