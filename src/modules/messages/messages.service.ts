import { Inject, Injectable } from '@nestjs/common';
import { Op, col, fn, literal } from 'sequelize';
import { User } from '../users/user.entity';
import { MessageDto } from './message.dto';
import { Message } from './message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @Inject('MESSAGE_REPOSITORY')
    private readonly messageRepository: typeof Message,
  ) {}

  async create(message: MessageDto, senderId: number): Promise<Message> {
    return await this.messageRepository.create<Message>({
      ...message,
      senderId,
    });
  }

  async findMessages(senderId: number, receiverId: number): Promise<Array<Message>> {
    return (
      await this.messageRepository.findAll<Message>({
        where: {
          [Op.or]: [
            {
              senderId: senderId,
              receiverId: receiverId,
            },
            {
              senderId: receiverId,
              receiverId: senderId,
            },
          ],
        },
        attributes: [
          'id',
          'message',
          'senderId',
          'receiverId',
          [fn('TO_CHAR', literal('"Message"."createdAt"'), 'HH24:MI'), 'createdFormatDate'],
        ],
        order: [['createdAt', 'DESC']],
        limit: 30,
      })
    ).reverse();
  }

  async findLastMessages(userId: number): Promise<Array<any>> {
    return await this.messageRepository
      .findAll<Message>({
        where: {
          [Op.or]: [{ receiverId: userId }, { senderId: userId }],
        },
        attributes: ['senderId', 'receiverId', [fn('MAX', col('id')), 'id']],
        group: ['senderId', 'receiverId'],
      })
      .then(async (messages) => {
        const foundMessages = await this.messageRepository.findAll<Message>({
          where: {
            id: {
              [Op.in]: messages.map((el) => el.get('id')),
            },
          },
          include: [
            {
              model: User,
              as: 'receiver',
              on: {
                id: [literal('"Message"."receiverId"')],
              },
              attributes: ['id', 'name'],
              required: true,
            },
            {
              model: User,
              as: 'sender',
              on: {
                id: [literal('"Message"."senderId"')],
              },
              attributes: ['id', 'name'],
              required: true,
            },
          ],
          attributes: [
            'id',
            'message',
            'createdAt',
            'senderId',
            'receiverId',
            [fn('TO_CHAR', literal('"Message"."createdAt"'), 'DD.MM.YY HH24:MI'), 'createdFormatDate'],
          ],
          order: [[literal('"Message"."createdAt"'), 'desc']],
        });

        const doubleIndexes = [
          ...new Set(
            foundMessages
              .map((msg, i) => {
                const double = foundMessages.findIndex(
                  (_) => _.senderId === msg.receiverId && _.receiverId === msg.senderId,
                );

                if (double === -1) return -1;
                if (foundMessages[i].id < foundMessages[double].id) return foundMessages[i].id;
                return foundMessages[double].id;
              })
              .filter((el) => el !== -1),
          ),
        ];

        return foundMessages.filter((el) => doubleIndexes.indexOf(el.id) === -1);
      });
  }
}
