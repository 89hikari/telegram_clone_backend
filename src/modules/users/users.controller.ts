import { Controller, Get, Param, UseGuards, Query, Request } from '@nestjs/common'
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('/users')
export class UsersController {

    constructor(private userService: UsersService) { }

    @Get('/:id')
    @UseGuards(AuthGuard('jwt'))
    getUser(@Param('id') id) {
        return this.userService.findOneById(id);
    }

    @Get('')
    @UseGuards(AuthGuard('jwt'))
    getUsers(@Query('limit') limit: number, @Query('search') search: string, @Request() req) {
        return this.userService.findList(limit, search, req.user.id);
    }
}