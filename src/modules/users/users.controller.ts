import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { avatarUploadConfig } from "../../common/config/multer.config";
import { UsersService } from "./users.service";

@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  @UseGuards(AuthGuard("jwt"))
  getUser(@Param("id") id: string | number, @Request() req) {
    return this.usersService.findOneById(id === "self" ? req.user.id : id);
  }

  @Get("")
  @UseGuards(AuthGuard("jwt"))
  getUsers(@Query("limit") limit: number, @Query("search") search: string, @Request() req) {
    return this.usersService.findList(limit, search, req.user.id);
  }

  @Post("upload-avatar")
  @UseInterceptors(FileInterceptor("file", avatarUploadConfig))
  @UseGuards(AuthGuard("jwt"))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Body("id") id: number, @Request() req) {
    if (req.user.id != id) {
      throw new ForbiddenException("No access");
    }
    return this.usersService.updateAvatar(id, file);
  }

  @Get(":id/avatar")
  async getAvatar(@Param("id") id: number, @Res() res: Response) {
    const avatar = await this.usersService.getAvatar(id);
    if (!avatar) {
      throw new NotFoundException("Avatar not found");
    }

    res.setHeader("Content-Type", "image/png");
    res.send(avatar);
  }
}
