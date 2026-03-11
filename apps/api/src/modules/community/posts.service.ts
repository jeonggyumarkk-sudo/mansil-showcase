import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreatePostDto, authorId: string) {
        return this.prisma.post.create({
            data: {
                title: data.title,
                content: data.content,
                category: data.category,
                authorId,
            },
        });
    }

    async findAll(category?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = category && category !== 'ALL' ? { category } : {};

        const [data, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                include: {
                    author: {
                        select: { id: true, name: true },
                    },
                    _count: {
                        select: { comments: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.post.count({ where }),
        ]);

        return { data, total, page, limit };
    }

    async findOne(id: string) {
        const post = await this.prisma.post.update({
            where: { id },
            data: { views: { increment: 1 } },
            include: {
                author: {
                    select: { id: true, name: true },
                },
                comments: {
                    include: {
                        author: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!post) {
            throw new NotFoundException('게시글을 찾을 수 없습니다');
        }

        return post;
    }

    async update(id: string, data: UpdatePostDto, authorId: string) {
        // Verify ownership
        const post = await this.prisma.post.findFirst({
            where: { id, authorId },
        });

        if (!post) {
            throw new NotFoundException('게시글을 찾을 수 없거나 수정 권한이 없습니다');
        }

        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.category !== undefined) updateData.category = data.category;

        return this.prisma.post.update({
            where: { id },
            data: updateData,
            include: {
                author: { select: { id: true, name: true } },
            },
        });
    }

    async remove(id: string, authorId: string) {
        // Verify ownership
        const post = await this.prisma.post.findFirst({
            where: { id, authorId },
        });

        if (!post) {
            throw new NotFoundException('게시글을 찾을 수 없거나 삭제 권한이 없습니다');
        }

        return this.prisma.post.delete({ where: { id } });
    }
}
