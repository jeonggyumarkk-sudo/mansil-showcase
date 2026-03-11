import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../../prisma.service';

describe('CommentsService', () => {
    let service: CommentsService;
    let prisma: any;

    const mockComment = {
        id: 'comment-1',
        content: '좋은 정보 감사합니다',
        postId: 'post-1',
        authorId: 'user-1',
        author: { id: 'user-1', name: '김에이전트' },
        createdAt: new Date(),
    };

    beforeEach(async () => {
        prisma = {
            post: {
                findUnique: jest.fn(),
            },
            comment: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommentsService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<CommentsService>(CommentsService);
    });

    describe('create', () => {
        it('should create a comment with post association', async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 'post-1' });
            prisma.comment.create.mockResolvedValue(mockComment);

            const result = await service.create({ content: '좋은 정보 감사합니다' } as any, 'post-1', 'user-1');

            expect(prisma.post.findUnique).toHaveBeenCalledWith({ where: { id: 'post-1' } });
            expect(prisma.comment.create).toHaveBeenCalledWith({
                data: {
                    content: '좋은 정보 감사합니다',
                    postId: 'post-1',
                    authorId: 'user-1',
                },
                include: {
                    author: { select: { id: true, name: true } },
                },
            });
            expect(result).toEqual(mockComment);
        });

        it('should throw NotFoundException when post does not exist', async () => {
            prisma.post.findUnique.mockResolvedValue(null);

            await expect(
                service.create({ content: 'test' } as any, 'nonexistent', 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should not create comment when post not found', async () => {
            prisma.post.findUnique.mockResolvedValue(null);

            try {
                await service.create({ content: 'test' } as any, 'nonexistent', 'user-1');
            } catch {
                // expected
            }

            expect(prisma.comment.create).not.toHaveBeenCalled();
        });
    });

    describe('findByPost', () => {
        it('should return comments for a post ordered by createdAt', async () => {
            prisma.comment.findMany.mockResolvedValue([mockComment]);

            const result = await service.findByPost('post-1');

            expect(prisma.comment.findMany).toHaveBeenCalledWith({
                where: { postId: 'post-1' },
                include: {
                    author: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'asc' },
            });
            expect(result).toEqual([mockComment]);
        });

        it('should return empty array when no comments', async () => {
            prisma.comment.findMany.mockResolvedValue([]);

            const result = await service.findByPost('post-1');

            expect(result).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update comment content after ownership verification', async () => {
            prisma.comment.findFirst.mockResolvedValue(mockComment);
            prisma.comment.update.mockResolvedValue({ ...mockComment, content: '수정된 댓글' });

            const result = await service.update('comment-1', '수정된 댓글', 'user-1');

            expect(prisma.comment.findFirst).toHaveBeenCalledWith({
                where: { id: 'comment-1', authorId: 'user-1' },
            });
            expect(prisma.comment.update).toHaveBeenCalledWith({
                where: { id: 'comment-1' },
                data: { content: '수정된 댓글' },
                include: {
                    author: { select: { id: true, name: true } },
                },
            });
            expect(result.content).toBe('수정된 댓글');
        });

        it('should throw NotFoundException when comment not owned', async () => {
            prisma.comment.findFirst.mockResolvedValue(null);

            await expect(
                service.update('comment-1', 'test', 'other-user'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete comment after ownership verification', async () => {
            prisma.comment.findFirst.mockResolvedValue(mockComment);
            prisma.comment.delete.mockResolvedValue(mockComment);

            await service.remove('comment-1', 'user-1');

            expect(prisma.comment.findFirst).toHaveBeenCalledWith({
                where: { id: 'comment-1', authorId: 'user-1' },
            });
            expect(prisma.comment.delete).toHaveBeenCalledWith({
                where: { id: 'comment-1' },
            });
        });

        it('should throw NotFoundException when comment not owned', async () => {
            prisma.comment.findFirst.mockResolvedValue(null);

            await expect(service.remove('comment-1', 'other-user')).rejects.toThrow(NotFoundException);
        });
    });
});
