import { Controller, Get, Param, Put, Body, UseInterceptors, UseGuards } from '@nestjs/common'
import { UsersService } from './modules/users/users.service';
import { UserDto } from './modules/users/user.dto';
import { NotFoundInterceptor } from './interceptors/notfound.interceptor';
import { AuthGuard } from '@nestjs/passport';

@Controller('/api')
export class AppController {

    constructor(private userService: UsersService) { }

    @Get('/users/:id')
    @UseInterceptors(NotFoundInterceptor)
    @UseGuards(AuthGuard('jwt'))
    getUser(@Param('id') id) {
        return this.userService.findOneById(id);
    }

    @Put('/users')
    createUser(@Body() userDto: UserDto) {
        return this.userService.create(userDto);
    }
}