import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/db/db.module";
import { UsersModule } from "src/modules/users/users.module";
import { GroupMembersRepository } from "./group-members.repository";
import { GroupMessagesRepository } from "./group-messages.repository";
import { GroupsController } from "./groups.controller";
import { GroupsRepository } from "./groups.repository";
import { GroupsService } from "./groups.service";

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsRepository, GroupMembersRepository, GroupMessagesRepository],
  exports: [GroupsService, GroupsRepository, GroupMembersRepository, GroupMessagesRepository],
})
export class GroupsModule {}
