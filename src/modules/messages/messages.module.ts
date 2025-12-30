import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/db/db.module";
import { UsersModule } from "src/modules/users/users.module";
import { MessagesController } from "./messages.controller";
import { MessagesRepository } from "./messages.repository";
import { MessagesService } from "./messages.service";

@Module({
  imports: [DatabaseModule, UsersModule],
  providers: [MessagesService, MessagesRepository],
  controllers: [MessagesController],
  exports: [MessagesService, MessagesRepository],
})
export class MessagesModule {}
