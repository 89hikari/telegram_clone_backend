import { Sequelize } from "sequelize-typescript";
import { GroupMember } from "src/modules/groups/group-member.entity";
import { GroupMessage } from "src/modules/groups/group-message.entity";
import { Group } from "src/modules/groups/group.entity";
import { Message } from "src/modules/messages/message.entity";
import { User } from "src/modules/users/user.entity";
import { databaseConfig } from "./db.config";
import { DEVELOPMENT, PRODUCTION, SEQUELIZE, TEST } from "./db.constants";

export const databaseProviders = [
  {
    provide: SEQUELIZE,
    useFactory: async () => {
      let config;
      switch (process.env.NODE_ENV) {
        case DEVELOPMENT:
          config = databaseConfig.development;
          break;
        case TEST:
          config = databaseConfig.test;
          break;
        case PRODUCTION:
          config = databaseConfig.production;
          break;
        default:
          config = databaseConfig.development;
      }
      const sequelize = new Sequelize(config);
      sequelize.addModels([User, Message, Group, GroupMember, GroupMessage]);
      await sequelize.sync();
      return sequelize;
    },
  },
];
