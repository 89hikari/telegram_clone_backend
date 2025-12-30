import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Op } from "sequelize";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { User } from "../users/user.entity";
import { UsersService } from "../users/users.service";
import { LastMessageResponseDto } from "./dto/last-message-response.dto";
import { MessageResponseDto } from "./dto/message-response.dto";
import { MessageDto } from "./message.dto";
import { Message } from "./message.entity";
import { MessagesRepository } from "./messages.repository";

export type SenderOrReceiverPerson = {
  id: number;
  name: string;
  avatar?: string;
};

export interface ILastMessages {
  id: number;
  createdAt: string | Date;
  message: string;
  receiverId: number;
  senderId: number;
  sender: SenderOrReceiverPerson;
  receiver: SenderOrReceiverPerson;
}

export interface IMessages {
  id: number;
  message: string;
  senderId: number;
  receiverId: number;
  createdAt: string | Date;
}

export type PeerPair = {
  senderId: number;
  receiverId: number;
};

export type MessageResponse = MessageResponseDto;
export type LastMessageResponse = LastMessageResponseDto;

export interface ILastMessageRow {
  id: number;
  message: string;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  receiver_id: number;
  receiver_name: string;
  receiver_avatar?: string;
  created_at: string | Date;
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Handles an outgoing websocket message: persists it and emits to sender and receiver if connected
   * @param server - Socket.IO server
   * @param client - Sender socket
   * @param payload - Message payload
   */
  async handleOutgoingMessage(server: Server, client: Socket, payload: MessageDto): Promise<void> {
    if (!client.data?.userId) {
      throw new Error("User not initialized. Call initUser first.");
    }

    if (!payload.receiverId) {
      throw new Error("Receiver ID is required");
    }

    const senderId = client.data.userId as number;

    const senderInfo = await this.usersService.findOneById(senderId);
    if (!senderInfo) {
      throw new Error("Sender not found");
    }

    // persist message
    await this.create(payload, senderId as number);

    const peer = Array.from(server.sockets.sockets.values()).find((el) => el.data?.userId === payload.receiverId);

    const newMessage: MessageDto & {
      messageId: string;
      self: boolean;
      date: Date;
      senderInfo: User;
    } = {
      messageId: uuidv4(),
      self: true,
      date: new Date(),
      senderInfo,
      ...payload,
    };

    client.emit("newMessage", newMessage);
    newMessage.self = false;
    peer?.emit("newMessage", newMessage);
  }

  /**
   * Creates a new message
   * @param message - Message content and receiver ID
   * @param senderId - ID of message sender
   * @returns Created message
   */
  async create(message: MessageDto, senderId: number): Promise<Message> {
    return await this.messagesRepository.create({
      ...message,
      senderId,
    });
  }

  /**
   * Updates a message only if the requester is the original sender
   * @param messageId - ID of the message to update
   * @param senderId - ID of the user attempting the update
   * @param newContent - New message text
   * @returns Updated message mapped to response format
   */
  async updateMessage(messageId: number, senderId: number, newContent: string): Promise<MessageResponse> {
    const existing = await this.messagesRepository.findOne({ where: { id: messageId, senderId } });

    if (!existing) {
      throw new NotFoundException("Message not found or not owned by user");
    }

    existing.message = newContent;
    await existing.save();

    const createdAt = existing.getDataValue("createdAt") as string | Date;

    return {
      id: existing.id,
      message: existing.message,
      senderId: existing.senderId,
      receiverId: existing.receiverId,
      date: typeof createdAt === "string" ? createdAt : createdAt.toISOString(),
      isMe: true,
    };
  }

  /**
   * Gets all peers that current user has conversations with
   * @param userId - Current user ID
   * @returns Array of sender/receiver pairs
   */
  async getPeersWithConversations(userId: number): Promise<PeerPair[]> {
    const rows = await this.messagesRepository.findAll({
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
      raw: true,
    });

    return rows as PeerPair[];
  }

  /**
   * Finds all messages between two users
   * @param senderId - First user ID
   * @param receiverId - Second user ID
   * @returns Array of messages ordered by date
   */
  async findMessages(senderId: number, receiverId: number): Promise<MessageResponse[]> {
    const queryResult =
      ((await this.messagesRepository.findAll({
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
        raw: true,
      })) as unknown as IMessages[]) || [];

    return queryResult.map((el) => {
      const isMe = senderId === el.senderId;
      return {
        id: el.id,
        message: el.message,
        senderId: el.senderId,
        receiverId: el.receiverId,
        date: typeof el.createdAt === "string" ? el.createdAt : el.createdAt.toISOString(),
        isMe: isMe,
      };
    });
  }

  /**
   * Finds the last message from each conversation
   * Deduplicates bidirectional conversations
   * @param userId - Current user ID
   * @returns Array of last messages grouped by conversation
   */
  async findLastMessages(userId: number): Promise<LastMessageResponse[]> {
    // Optimized single-query approach: normalize pair ordering with GREATEST/LEAST
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sequelize = (this.messagesRepository as any).getModel
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.messagesRepository as any).getModel().sequelize
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.messagesRepository as any).repository?.sequelize;

    if (!sequelize) {
      // fallback to previous implementation if we can't access sequelize instance
      const fallback = await this.getPeersWithConversations(userId);
      return (
        (await Promise.all(
          fallback.map(async (pair) => {
            const last = await this.messagesRepository.findAll({
              where: { senderId: pair.senderId, receiverId: pair.receiverId },
              order: [["createdAt", "desc"]],
              limit: 1,
              include: [
                { model: User, as: "sender", attributes: ["id", "name", "avatar"] },
                { model: User, as: "receiver", attributes: ["id", "name", "avatar"] },
              ],
            });
            return last[0] ? (last[0].get({ plain: true }) as unknown as ILastMessages) : null;
          }),
        )) || []
      )
        .filter(Boolean)
        .map((el) => {
          const isMe = userId === el.receiver.id;
          return {
            id: el.id,
            date: typeof el.createdAt === "string" ? el.createdAt : el.createdAt.toISOString(),
            message: el.message,
            personId: isMe ? el.sender.id : el.receiver.id,
            personName: isMe ? el.sender.name : el.receiver.name,
            hasAvatar: isMe ? !!el.sender.avatar : !!el.receiver.avatar,
          };
        });
    }

    const sql = `
      SELECT m.*,
             s.id as sender_id, s.name as sender_name, s.avatar as sender_avatar,
             r.id as receiver_id, r.name as receiver_name, r.avatar as receiver_avatar
      FROM "Messages" m
      JOIN (
        SELECT GREATEST("sender_id", "receiver_id") AS u1,
               LEAST("sender_id", "receiver_id") AS u2,
               MAX(id) AS id
        FROM "Messages"
        WHERE "sender_id" = :userId OR "receiver_id" = :userId
        GROUP BY GREATEST("sender_id", "receiver_id"), LEAST("sender_id", "receiver_id")
      ) sub ON sub.id = m.id
      JOIN "Users" s ON s.id = m."sender_id"
      JOIN "Users" r ON r.id = m."receiver_id"
      ORDER BY m."created_at" DESC
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await sequelize.query(sql, { replacements: { userId }, type: (sequelize as any).QueryTypes.SELECT });
    const results = (rows as ILastMessageRow[]).map((row) => {
      const isMe = userId === row.receiver_id;
      return {
        id: row.id,
        date: typeof row.created_at === "string" ? row.created_at : (row.created_at as Date).toISOString(),
        message: row.message,
        personId: isMe ? row.sender_id : row.receiver_id,
        personName: isMe ? row.sender_name : row.receiver_name,
        hasAvatar: isMe ? !!row.sender_avatar : !!row.receiver_avatar,
      } as LastMessageResponse;
    });

    return results;
  }
}
