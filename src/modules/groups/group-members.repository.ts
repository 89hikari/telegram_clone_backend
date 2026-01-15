import { Inject, Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { BaseRepository } from "src/common/repositories/base.repository";
import { SEQUELIZE } from "src/db/db.constants";
import { GroupMember } from "./group-member.entity";

@Injectable()
export class GroupMembersRepository extends BaseRepository<GroupMember> {
  constructor(@Inject(SEQUELIZE) sequelize: Sequelize) {
    super(sequelize.getRepository(GroupMember));
  }
}
