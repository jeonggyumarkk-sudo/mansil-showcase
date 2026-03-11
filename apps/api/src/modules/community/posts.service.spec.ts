import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../../prisma.service';

describe('PostsService', () => {
    let service: PostsService;
    let prisma: any;

    const mockPost = {
        id: 'post-1',
        title: '강남 시장 동향',
        content: '최근 강남 부동산 시장이...',
        category: 'MARKET',
        views: 10,
        authorId: 'user-1',
        author: { id: 'user-1', name: '김에이전트' },
        createdAt: new Date(),
    };

    beforeEach(async () => {
        prisma = {
            post: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostsService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<PostsService>(PostsService);
    });

    describe('create', () => {
        it('should create a post with correct data', async () => {
            prisma.post.create.mockResolvedValue(mockPost);

            const dto = {
                title: '강남 시장 동향',
                content: '최근 강남 부동산 시장이...',
                category: 'MARKET',
            };

            const result = await service.create(dto as any, 'user-1');

            expect(prisma.post.create).toHaveBeenCalledWith({
                data: {
                    title: '강남 시장 동향',
                    content: '최근 강남 부동산 시장이...',
                    category: 'MARKET',
                    authorId: 'user-1',
                },
            });
            expect(result).toEqual(mockPost);
        });
    });

    describe('findAll', () => {
        it('should return paginated posts', async () => {
            prisma.post.findMany.mockResolvedValue([mockPost]);
            prisma.post.count.mockResolvedValue(1);

            const result = await service.findAll();

            expect(result).toEqual({
                data: [mockPost],
                total: 1,
                page: 1,
                limit: 20,
            });
        });

        it('should filter by category when provided', async () => {
            prisma.post.findMany.mockResolvedValue([]);
            prisma.post.count.mockResolvedValue(0);

            await service.findAll('MARKET');

            expect(prisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { category: 'MARKET' },
                }),
            );
        });

        it('should not filter by category when ALL is provided', async () => {
            prisma.post.findMany.mockResolvedValue([]);
            prisma.post.count.mockResolvedValue(0);

            await service.findAll('ALL');

            expect(prisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {},
                }),
            );
        });

        it('should not filter by category when undefined', async () => {
            prisma.post.findMany.mockResolvedValue([]);
            prisma.post.count.mockResolvedValue(0);

            await service.findAll(undefined);

            expect(prisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {},
                }),
            );
        });

        it('should include author and comment count', async () => {
            prisma.post.findMany.mockResolvedValue([]);
            prisma.post.count.mockResolvedValue(0);

            await service.findAll();

            expect(prisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: {
                        author: { select: { id: true, name: true } },
                        _count: { select: { comments: true } },
                    },
                }),
            );
        });

        it('should apply pagination', async () => {
            prisma.post.findMany.mockResolvedValue([]);
            prisma.post.count.mockResolvedValue(50);

            const result = await service.findAll(undefined, 3, 10);

            expect(prisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20,
                    take: 10,
                }),
            );
            expect(result.page).toBe(3);
        });
    });

    describe('findOne', () => {
        it('should return post and increment viewCount', async () => {
            const postWithComments = {
                ...mockPost,
                views: 11,
                comments: [],
            };
            prisma.post.update.mockResolvedValue(postWithComments);

            const result = await service.findOne('post-1');

            expect(prisma.post.update).toHaveBeenCalledWith({
                where: { id: 'post-1' },
                data: { views: { increment: 1 } },
                include: {
                    author: { select: { id: true, name: true } },
                    comments: {
                        include: {
                            author: { select: { id: true, name: true } },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            expect(result).toEqual(postWithComments);
        });

        it('should throw NotFoundException when post not found', async () => {
            prisma.post.update.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update post after ownership verification', async () => {
            prisma.post.findFirst.mockResolvedValue(mockPost);
            prisma.post.update.mockResolvedValue({ ...mockPost, title: '업데이트된 제목' });

            const result = await service.update('post-1', { title: '업데이트된 제목' } as any, 'user-1');

            expect(prisma.post.findFirst).toHaveBeenCalledWith({
                where: { id: 'post-1', authorId: 'user-1' },
            });
            expect(prisma.post.update).toHaveBeenCalledWith({
                where: { id: 'post-1' },
                data: { title: '업데이트된 제목' },
                include: {
                    author: { select: { id: true, name: true } },
                },
            });
            expect(result.title).toBe('업데이트된 제목');
        });

        it('should throw NotFoundException when post not owned by author', async () => {
            prisma.post.findFirst.mockResolvedValue(null);

            await expect(
                service.update('post-1', { title: 'test' } as any, 'other-user'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should only include provided fields in update', async () => {
            prisma.post.findFirst.mockResolvedValue(mockPost);
            prisma.post.update.mockResolvedValue(mockPost);

            await service.update('post-1', { content: '새 내용' } as any, 'user-1');

            expect(prisma.post.update).toHaveBeenCalledWith({
                where: { id: 'post-1' },
                data: { content: '새 내용' },
                include: expect.anything(),
            });
        });
    });

    describe('remove', () => {
        it('should delete post after ownership verification', async () => {
            prisma.post.findFirst.mockResolvedValue(mockPost);
            prisma.post.delete.mockResolvedValue(mockPost);

            await service.remove('post-1', 'user-1');

            expect(prisma.post.findFirst).toHaveBeenCalledWith({
                where: { id: 'post-1', authorId: 'user-1' },
            });
            expect(prisma.post.delete).toHaveBeenCalledWith({
                where: { id: 'post-1' },
            });
        });

        it('should throw NotFoundException when post not owned', async () => {
            prisma.post.findFirst.mockResolvedValue(null);

            await expect(service.remove('post-1', 'other-user')).rejects.toThrow(NotFoundException);
        });
    });
});
