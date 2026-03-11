import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('posts/:postId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    create(
        @Param('postId') postId: string,
        @Body() createCommentDto: CreateCommentDto,
        @CurrentUser() user: any,
    ) {
        return this.commentsService.create(createCommentDto, postId, user.id);
    }

    @Get()
    findByPost(@Param('postId') postId: string) {
        return this.commentsService.findByPost(postId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateCommentDto: UpdateCommentDto,
        @CurrentUser() user: any,
    ) {
        return this.commentsService.update(id, updateCommentDto.content, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.commentsService.remove(id, user.id);
    }
}
