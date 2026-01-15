import { Inject, Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { BaseRepository } from "src/common/repositories/base.repository";
import { SEQUELIZE } from "src/db/db.constants";
import { Group } from "./group.entity";

@Injectable()
export class GroupsRepository extends BaseRepository<Group> {
  constructor(@Inject(SEQUELIZE) sequelize: Sequelize) {
    super(sequelize.getRepository(Group));
  }
}
