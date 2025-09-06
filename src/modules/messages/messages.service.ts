import { Inject, Injectable } from "@nestjs/common";
import { Op, col, fn, literal } from "sequelize";
import { User } from "../users/user.entity";
import { MessageDto } from "./message.dto";
import { Message } from "./message.entity";

type SenderOrReceiverPerson = {
  id: number;
  name: string;
  avatar?: string;
};

interface ILastMessages {
  id: number;
  createdAt: string;
  message: string;
  receiverId: number;
  senderId: string;
  sender: SenderOrReceiverPerson;
  receiver: SenderOrReceiverPerson;
}

interface IMessages {
  id: number;
  message: string;
  senderId: number;
  receiverId: number;
  date: string;
  time: string;
}

@Injectable()
export class MessagesService {
  constructor(
    @Inject("MESSAGE_REPOSITORY")
    private readonly messageRepository: typeof Message,
  ) {}

  async create(message: MessageDto, senderId: number): Promise<Message> {
    return await this.messageRepository.create<Message>({
      ...message,
      senderId,
    });
  }

  async getPeersWithConversations(userId: number): Promise<Array<any>> {
    return await this.messageRepository.findAll<Message>({
      where: {
        [Op.or]: [
          {
            receiverId: userId,
          },
          {
            senderId: userId,
          },
        ],
      },
      attributes: ["receiverId", "senderId"],
    });
  }

  async findMessages(senderId: number, receiverId: number): Promise<Array<any>> {
    const queryResult =
      ((
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
          attributes: ["id", "message", "senderId", "receiverId", "createdAt"],
          order: [["createdAt", "asc"]],
          limit: 30,
        })
      ).map(({ dataValues }) => dataValues) as unknown[] as IMessages[]) || [];

    return queryResult.map((el) => {
      const isMe = senderId === el.senderId;
      return {
        ...el,
        isMe: isMe,
      };
    });
  }

  async findLastMessages(userId: number): Promise<Array<any>> {
    const queryResult =
      ((
        await this.messageRepository
          .findAll<Message>({
            where: {
              [Op.or]: [{ receiverId: userId }, { senderId: userId }],
            },
            attributes: ["senderId", "receiverId", [fn("MAX", col("id")), "id"]],
            group: ["senderId", "receiverId"],
          })
          .then(async (messages) => {
            const foundMessages = await this.messageRepository.findAll<Message>({
              where: {
                id: {
                  [Op.in]: messages.map((el) => el.get("id")),
                },
              },
              include: [
                {
                  model: User,
                  as: "receiver",
                  on: {
                    id: [literal('"Message"."receiverId"')],
                  },
                  attributes: ["id", "name", "avatar"],
                  required: true,
                },
                {
                  model: User,
                  as: "sender",
                  on: {
                    id: [literal('"Message"."senderId"')],
                  },
                  attributes: ["id", "name", "avatar"],
                  required: true,
                },
              ],
              attributes: ["id", "message", "createdAt", "senderId", "receiverId", "createdAt"],
              order: [[literal('"Message"."createdAt"'), "desc"]],
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
          })
      ).map(({ dataValues }) => dataValues) as unknown[] as ILastMessages[]) || [];

    return queryResult.map((el) => {
      const isMe = userId === el.receiver.id;
      return {
        id: el.id,
        date: el.createdAt,
        message: el.message,
        personId: isMe ? el.sender.id : el.receiver.id,
        personName: isMe ? el.sender.name : el.receiver.name,
        hasAvatar: isMe ? !!el.sender.avatar : !!el.receiver.avatar,
      };
    });
  }
}
