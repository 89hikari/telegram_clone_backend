import { Body, Controller, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AddGroupMemberDto } from "./dto/add-group-member.dto";
import { CreateGroupDto } from "./dto/create-group.dto";
import { GroupMessageResponseDto } from "./dto/group-message-response.dto";
import { GroupMessageDto } from "./dto/group-message.dto";
import { GroupResponseDto } from "./dto/group-response.dto";
import { GroupsService } from "./groups.service";

@Controller({ path: "groups", version: "1" })
@UseGuards(AuthGuard("jwt"))
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(@Body() body: CreateGroupDto, @Request() req): Promise<GroupResponseDto> {
    return await this.groupsService.createGroup(req.user.id, body);
  }

  @Get()
  async list(@Request() req): Promise<GroupResponseDto[]> {
    return await this.groupsService.listUserGroups(req.user.id);
  }

  @Post(":id/members")
  async addMember(@Param("id") id: number, @Body() body: AddGroupMemberDto, @Request() req) {
    return await this.groupsService.addMember(id, req.user.id, body);
  }

  @Get(":id/messages")
  async getMessages(@Param("id") id: number, @Request() req): Promise<GroupMessageResponseDto[]> {
    return await this.groupsService.getGroupMessages(id, req.user.id);
  }

  @Post(":id/messages")
  async sendMessage(
    @Param("id") id: number,
    @Body() body: GroupMessageDto,
    @Request() req,
  ): Promise<GroupMessageResponseDto> {
    return await this.groupsService.sendGroupMessage(id, req.user.id, body.message);
  }
}
