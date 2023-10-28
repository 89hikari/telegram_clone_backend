import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { messagesProvider } from './messages.providers';
import { MessagesController } from './messages.controller';

@Module({
    providers: [MessagesService, ...messagesProvider],
    controllers: [MessagesController],
})
export class MessagesModule { }