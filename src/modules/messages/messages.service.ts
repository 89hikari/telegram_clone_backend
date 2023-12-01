import { Injectable, Inject } from '@nestjs/common';
import { Message } from './message.entity';
import { MessageDto } from './message.dto';
import { Op, fn, col, literal } from 'sequelize';

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

    async findLastMessages(userId: number): Promise<Array<Message>> {
        return await this.messageRepository.findAll<Message>({
            where: {
                [Op.or]: [
                    { receiverId: userId },
                    { senderId: userId }
                ]
            },
            attributes: ["senderId", "receiverId", [fn('MAX', col('id')), "id"]],
            group: ["senderId", "receiverId"]
        }).then(async (messages) => {
            return await this.messageRepository.findAll<Message>({
                where: {
                    id: {
                        [Op.in]: messages.map(el => el.get("id"))
                    }
                }
            })
        })
    }
}