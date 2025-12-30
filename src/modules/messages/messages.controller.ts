import { Body, Controller, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { LastMessageResponseDto } from "./dto/last-message-response.dto";
import { MessageResponseDto } from "./dto/message-response.dto";
import { MessageDto } from "./message.dto";
import { MessagesService } from "./messages.service";

@Controller({ path: "messages", version: "1" })
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Get messages between current user and specific peer
   */
  @UseGuards(AuthGuard("jwt"))
  @Get(":id")
  async get(@Param("id") id: number, @Request() req): Promise<MessageResponseDto[]> {
    return await this.messagesService.findMessages(req.user.id, id);
  }

  /**
   * Get last messages from all conversations
   */
  @UseGuards(AuthGuard("jwt"))
  @Get()
  async getLastMessages(@Request() req): Promise<LastMessageResponseDto[]> {
    return await this.messagesService.findLastMessages(req.user.id);
  }

  /**
   * Create new message
   */
  @UseGuards(AuthGuard("jwt"))
  @Post()
  async create(@Body() message: MessageDto, @Request() req): Promise<MessageDto> {
    return await this.messagesService.create(message, req.user.id);
  }
}
