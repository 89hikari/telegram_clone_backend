import { Injectable, Inject } from '@nestjs/common';
import { Message } from './message.entity';
import { MessageDto } from './message.dto';

@Injectable()
export class MessagesService {
    constructor(@Inject('MESSAGE_REPOSITORY') private readonly messageRepository: typeof Message) { }

    async create(message: MessageDto, senderId: number): Promise<Message> {
        return await this.messageRepository.create<Message>({ ...message, senderId });
    }

    async findMessages(senderId: number, receiverId: number): Promise<Array<Message>> {
        return await this.messageRepository.findAll<Message>({
            where: { senderId, receiverId },
        });
    }
}