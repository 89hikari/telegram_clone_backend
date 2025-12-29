import { Module } from "@nestjs/common";
import { MessagesController } from "./messages.controller";
import { messagesProvider } from "./messages.providers";
import { MessagesService } from "./messages.service";

@Module({
  providers: [MessagesService, ...messagesProvider],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
