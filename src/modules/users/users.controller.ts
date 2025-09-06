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
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get(":id")
  @UseGuards(AuthGuard("jwt"))
  getUser(@Param("id") id: string | number, @Request() req) {
    return this.userService.findOneById(id === "self" ? req.user.id : id);
  }

  @Get("")
  @UseGuards(AuthGuard("jwt"))
  getUsers(@Query("limit") limit: number, @Query("search") search: string, @Request() req) {
    return this.userService.findList(limit, search, req.user.id);
  }

  @Post("upload-avatar")
  @UseInterceptors(FileInterceptor("file"))
  @UseGuards(AuthGuard("jwt"))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Body("id") id: number, @Request() req) {
    if (req.user.id != id) {
      throw new ForbiddenException("No access");
    }
    return this.userService.updateAvatar(id, file);
  }

  @Get(":id/avatar")
  async getAvatar(@Param("id") id: number, @Res() res: Response) {
    const avatar = await this.userService.getAvatar(id);
    if (!avatar) {
      throw new NotFoundException("Avatar not found");
    }

    res.setHeader("Content-Type", "image/png");
    res.send(avatar);
  }
}
