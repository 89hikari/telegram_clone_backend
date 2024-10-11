import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('/users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  getUser(@Param('id') id: string | number, @Request() req) {
    return this.userService.findOneById(id === "self" ? req.user.id : id);
  }

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  getUsers(@Query('limit') limit: number, @Query('search') search: string, @Request() req) {
    return this.userService.findList(limit, search, req.user.id);
  }
}
