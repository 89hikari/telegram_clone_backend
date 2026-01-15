import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { UsersService } from "src/modules/users/users.service";
import { AddGroupMemberDto } from "./dto/add-group-member.dto";
import { CreateGroupDto } from "./dto/create-group.dto";
import { GroupMessageResponseDto } from "./dto/group-message-response.dto";
import { GroupMessageDto } from "./dto/group-message.dto";
import { GroupResponseDto } from "./dto/group-response.dto";
import { GroupMember } from "./group-member.entity";
import { GroupMembersRepository } from "./group-members.repository";
import { GroupMessagesRepository } from "./group-messages.repository";
import { Group } from "./group.entity";
import { GroupsRepository } from "./groups.repository";

type GroupPresenceStatus = "online" | "offline";

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly groupMembersRepository: GroupMembersRepository,
    private readonly groupMessagesRepository: GroupMessagesRepository,
    private readonly usersService: UsersService,
  ) {}

  private async ensureGroupExists(groupId: number): Promise<Group> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException("Group not found");
    }
    return group;
  }

  private async ensureMembership(groupId: number, userId: number): Promise<GroupMember> {
    const membership = await this.groupMembersRepository.findOne({ where: { groupId, userId } });
    if (!membership) {
      throw new ForbiddenException("User is not a member of this group");
    }
    return membership;
  }

  private async ensureAdmin(groupId: number, userId: number): Promise<void> {
    const membership = await this.ensureMembership(groupId, userId);
    if (membership.role !== "admin") {
      throw new ForbiddenException("Only admins can manage members");
    }
  }

  async createGroup(ownerId: number, dto: CreateGroupDto): Promise<GroupResponseDto> {
    const owner = await this.usersService.findOneById(ownerId);
    if (!owner) {
      throw new NotFoundException("Owner not found");
    }

    const group = await this.groupsRepository.create({ name: dto.name, ownerId });
    await this.groupMembersRepository.create({
      groupId: group.id,
      userId: ownerId,
      role: "admin",
      joinedAt: new Date(),
    });

    if (dto.memberIds?.length) {
      const uniqueMembers = [...new Set(dto.memberIds.filter((id) => id !== ownerId))];
      for (const memberId of uniqueMembers) {
        const member = await this.usersService.findOneById(memberId);
        if (!member) {
          this.logger.warn(`Skipping non-existing user ${memberId} when adding to group ${group.id}`);
          continue;
        }
        const existing = await this.groupMembersRepository.findOne({ where: { groupId: group.id, userId: memberId } });
        if (!existing) {
          await this.groupMembersRepository.create({
            groupId: group.id,
            userId: memberId,
            role: "member",
            joinedAt: new Date(),
          });
        }
      }
    }

    return { id: group.id, name: group.name, ownerId: group.ownerId };
  }

  async addMember(groupId: number, requesterId: number, dto: AddGroupMemberDto): Promise<GroupMember> {
    await this.ensureGroupExists(groupId);
    await this.ensureAdmin(groupId, requesterId);

    const user = await this.usersService.findOneById(dto.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const existing = await this.groupMembersRepository.findOne({ where: { groupId, userId: dto.userId } });
    if (existing) {
      return existing;
    }

    return await this.groupMembersRepository.create({
      groupId,
      userId: dto.userId,
      role: "member",
      joinedAt: new Date(),
    });
  }

  async listUserGroups(userId: number): Promise<GroupResponseDto[]> {
    const memberships = await this.groupMembersRepository.findAll({
      where: { userId },
      include: [{ model: Group, attributes: ["id", "name", "ownerId"] }],
    });

    return memberships
      .map((membership) => {
        const group = membership.group as Group;
        if (!group) return null;
        return { id: group.id, name: group.name, ownerId: group.ownerId } as GroupResponseDto;
      })
      .filter(Boolean) as GroupResponseDto[];
  }

  async listUserGroupIds(userId: number): Promise<number[]> {
    const rows = (await this.groupMembersRepository.findAll({
      where: { userId },
      attributes: ["groupId"],
      raw: true,
    })) as unknown as Array<{ groupId: number }>;

    return [...new Set(rows.map((row) => row.groupId))];
  }

  async getGroupMessages(groupId: number, userId: number): Promise<GroupMessageResponseDto[]> {
    await this.ensureGroupExists(groupId);
    await this.ensureMembership(groupId, userId);

    const messages = (await this.groupMessagesRepository.findAll({
      where: { groupId },
      attributes: ["id", "groupId", "senderId", "message", "createdAt"],
      order: [["createdAt", "asc"]],
      limit: 50,
      raw: true,
    })) as unknown as Array<{
      id: number;
      groupId: number;
      senderId: number;
      message: string;
      createdAt: string | Date;
    }>;

    return messages.map((msg) => ({
      id: msg.id,
      groupId: msg.groupId,
      senderId: msg.senderId,
      message: msg.message,
      date: typeof msg.createdAt === "string" ? msg.createdAt : msg.createdAt.toISOString(),
      isMe: msg.senderId === userId,
    }));
  }

  async sendGroupMessage(groupId: number, senderId: number, message: string): Promise<GroupMessageResponseDto> {
    await this.ensureGroupExists(groupId);
    await this.ensureMembership(groupId, senderId);

    const created = await this.groupMessagesRepository.create({ groupId, senderId, message });
    const createdAt = created.getDataValue("createdAt") as string | Date;

    return {
      id: created.id,
      groupId: created.groupId,
      senderId: created.senderId,
      message: created.message,
      date: typeof createdAt === "string" ? createdAt : createdAt.toISOString(),
      isMe: true,
    };
  }

  async updateGroupMessage(messageId: number, senderId: number, newContent: string): Promise<GroupMessageResponseDto> {
    const existing = await this.groupMessagesRepository.findOne({ where: { id: messageId, senderId } });

    if (!existing) {
      throw new NotFoundException("Message not found or not owned by user");
    }

    await this.ensureMembership(existing.groupId, senderId);

    existing.message = newContent;
    await existing.save();

    const createdAt = existing.getDataValue("createdAt") as string | Date;

    return {
      id: existing.id,
      groupId: existing.groupId,
      senderId: existing.senderId,
      message: existing.message,
      date: typeof createdAt === "string" ? createdAt : createdAt.toISOString(),
      isMe: true,
    };
  }

  async getGroupMemberIds(groupId: number): Promise<number[]> {
    const rows = (await this.groupMembersRepository.findAll({
      where: { groupId },
      attributes: ["userId"],
      raw: true,
    })) as unknown as Array<{ userId: number }>;

    return rows.map((row) => row.userId);
  }

  async handleOutgoingGroupMessage(server: Server, client: Socket, payload: GroupMessageDto): Promise<void> {
    if (!client.data?.userId) {
      throw new Error("User not initialized. Call initUser first.");
    }

    if (!payload?.groupId) {
      throw new Error("Group ID is required");
    }

    if (!payload?.message) {
      throw new Error("Message content is required");
    }

    const senderId = client.data.userId as number;
    const messageResponse = await this.sendGroupMessage(payload.groupId, senderId, payload.message);
    const memberIds = await this.getGroupMemberIds(payload.groupId);

    const sockets = Array.from(server.sockets.sockets.values()).filter((socket) => {
      const socketUserId = socket.data?.userId;
      return socketUserId && memberIds.includes(socketUserId as number);
    });

    const senderInfo = await this.usersService.findOneById(senderId);
    const outgoing = {
      ...messageResponse,
      senderInfo,
      self: true,
    };

    client.emit("newGroupMessage", outgoing);
    sockets.forEach((socket) => {
      const socketUserId = socket.data?.userId as number | undefined;
      const isSelf = socketUserId === senderId;
      socket.emit("newGroupMessage", { ...outgoing, self: isSelf, isMe: isSelf });
    });
  }

  async handleEditGroupMessage(
    server: Server,
    client: Socket,
    payload: { id?: number; message?: string; groupId?: number },
  ): Promise<void> {
    if (!client.data?.userId) {
      throw new Error("User not initialized. Call initUser first.");
    }

    if (!payload?.id) {
      throw new Error("Message ID is required");
    }

    if (!payload?.message) {
      throw new Error("Message content is required");
    }

    const senderId = client.data.userId as number;
    const updated = await this.updateGroupMessage(payload.id, senderId, payload.message);
    const groupId = payload.groupId ?? updated.groupId;
    const memberIds = await this.getGroupMemberIds(groupId);

    const sockets = Array.from(server.sockets.sockets.values()).filter((socket) => {
      const socketUserId = socket.data?.userId;
      return socketUserId && memberIds.includes(socketUserId as number);
    });

    sockets.forEach((socket) => {
      const socketUserId = socket.data?.userId as number | undefined;
      const isSelf = socketUserId === senderId;
      socket.emit("groupMessageEdited", { ...updated, self: isSelf, isMe: isSelf });
    });
  }

  async broadcastGroupPresence(server: Server, userId: number, status: GroupPresenceStatus): Promise<void> {
    const groupIds = await this.listUserGroupIds(userId);
    if (!groupIds.length) return;

    const memberships = (await this.groupMembersRepository.findAll({
      where: { groupId: groupIds },
      attributes: ["groupId", "userId"],
      raw: true,
    })) as unknown as Array<{ groupId: number; userId: number }>;

    const sockets = Array.from(server.sockets.sockets.values());

    groupIds.forEach((groupId) => {
      const memberIds = memberships.filter((row) => row.groupId === groupId).map((row) => row.userId);
      sockets.forEach((socket) => {
        const socketUserId = socket.data?.userId as number | undefined;
        if (socketUserId && memberIds.includes(socketUserId)) {
          socket.emit("groupMemberPresence", { groupId, userId, status });
        }
      });
    });
  }
}
