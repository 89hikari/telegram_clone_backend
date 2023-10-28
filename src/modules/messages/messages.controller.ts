import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { Message as MessageEntity } from './message.entity';
import { MessageDto } from './message.dto';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async get(@Param('id') id: number, @Request() req): Promise<MessageEntity[]> {
        return await this.messagesService.findMessages(req.user.id, id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    async create(@Body() message: MessageDto, @Request() req): Promise<MessageDto> {
        return await this.messagesService.create(message, req.user.id);
    }

    // @Get(':id')
    // async findOne(@Param('id') id: number): Promise<PostEntity> {
    //     // find the post with this id
    //     const post = await this.postService.findOne(id);

    //     // if the post doesn't exit in the db, throw a 404 error
    //     if (!post) {
    //         throw new NotFoundException('This Post doesn\'t exist');
    //     }

    //     // if post exist, return the post
    //     return post;
    // }


    // @UseGuards(AuthGuard('jwt'))
    // @Put(':id')
    // async update(@Param('id') id: number, @Body() post: PostDto, @Request() req): Promise<PostEntity> {
    //     // get the number of row affected and the updated post
    //     const { numberOfAffectedRows, updatedPost } = await this.postService.update(id, post, req.user.id);

    //     // if the number of row affected is zero, 
    //     // it means the post doesn't exist in our db
    //     if (numberOfAffectedRows === 0) {
    //         throw new NotFoundException('This Post doesn\'t exist');
    //     }

    //     // return the updated post
    //     return updatedPost;
    // }

    // @UseGuards(AuthGuard('jwt'))
    // @Delete(':id')
    // async remove(@Param('id') id: number, @Request() req) {
    //     // delete the post with this id
    //     const deleted = await this.postService.delete(id, req.user.id);

    //     // if the number of row affected is zero, 
    //     // then the post doesn't exist in our db
    //     if (deleted === 0) {
    //         throw new NotFoundException('This Post doesn\'t exist');
    //     }

    //     // return success message
    //     return 'Successfully deleted';
    // }
}