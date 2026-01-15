import { Inject, Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { BaseRepository } from "src/common/repositories/base.repository";
import { SEQUELIZE } from "src/db/db.constants";
import { GroupMessage } from "./group-message.entity";

@Injectable()
export class GroupMessagesRepository extends BaseRepository<GroupMessage> {
  constructor(@Inject(SEQUELIZE) sequelize: Sequelize) {
    super(sequelize.getRepository(GroupMessage));
  }
}
