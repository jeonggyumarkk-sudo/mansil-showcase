import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateCommentDto, postId: string, authorId: string) {
        // Verify post exists
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            throw new NotFoundException('게시글을 찾을 수 없습니다');
        }

        return this.prisma.comment.create({
            data: {
                content: data.content,
                postId,
                authorId,
            },
            include: {
                author: { select: { id: true, name: true } },
            },
        });
    }

    async findByPost(postId: string) {
        return this.prisma.comment.findMany({
            where: { postId },
            include: {
                author: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async update(id: string, content: string, authorId: string) {
        const comment = await this.prisma.comment.findFirst({
            where: { id, authorId },
        });

        if (!comment) {
            throw new NotFoundException('댓글을 찾을 수 없거나 수정 권한이 없습니다');
        }

        return this.prisma.comment.update({
            where: { id },
            data: { content },
            include: {
                author: { select: { id: true, name: true } },
            },
        });
    }

    async remove(id: string, authorId: string) {
        const comment = await this.prisma.comment.findFirst({
            where: { id, authorId },
        });

        if (!comment) {
            throw new NotFoundException('댓글을 찾을 수 없거나 삭제 권한이 없습니다');
        }

        return this.prisma.comment.delete({ where: { id } });
    }
}
