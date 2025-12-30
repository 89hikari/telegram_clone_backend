import { Inject, Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { BaseRepository } from "src/common/repositories/base.repository";
import { SEQUELIZE } from "src/db/db.constants";
import { Message } from "./message.entity";

@Injectable()
export class MessagesRepository extends BaseRepository<Message> {
  constructor(@Inject(SEQUELIZE) sequelize: Sequelize) {
    super(sequelize.getRepository(Message));
  }
}
