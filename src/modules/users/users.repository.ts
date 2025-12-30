import { Inject, Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { BaseRepository } from "src/common/repositories/base.repository";
import { SEQUELIZE } from "src/db/db.constants";
import { User } from "./user.entity";

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(@Inject(SEQUELIZE) sequelize: Sequelize) {
    super(sequelize.getRepository(User));
  }
}
