import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PrismaService } from '../../prisma.service';

describe('PropertiesService', () => {
    let service: PropertiesService;
    let prisma: any;

    const mockProperty = {
        id: 'prop-1',
        title: '강남 원룸',
        description: '깔끔한 원룸',
        type: 'ONE_ROOM',
        transactionType: 'MONTHLY',
        status: 'AVAILABLE',
        deposit: 5000000,
        monthlyRent: 500000,
        areaPyeong: 8,
        floor: 3,
        totalFloors: 5,
        address: '서울시 강남구',
        roadAddress: '서울시 강남구',
        lat: 37.5,
        lng: 127.0,
        agentId: 'agent-1',
        deletedAt: null,
        images: [],
    };

    beforeEach(async () => {
        prisma = {
            property: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                count: jest.fn(),
            },
            $queryRaw: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PropertiesService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<PropertiesService>(PropertiesService);
    });

    describe('create', () => {
        it('should create a property with correct data', async () => {
            prisma.property.create.mockResolvedValue(mockProperty);

            const dto = {
                title: '강남 원룸',
                description: '깔끔한 원룸',
                type: 'ONE_ROOM',
                transactionType: 'MONTHLY',
                deposit: 5000000,
                monthlyRent: 500000,
                areaPyeong: 8,
                floor: 3,
                totalFloors: 5,
                address: '서울시 강남구',
            };

            const result = await service.create(dto as any, 'agent-1');

            expect(prisma.property.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: '강남 원룸',
                        agentId: 'agent-1',
                        status: 'AVAILABLE',
                    }),
                    include: { images: true },
                }),
            );
            expect(result).toEqual(mockProperty);
        });

        it('should combine address and detailAddress', async () => {
            prisma.property.create.mockResolvedValue(mockProperty);

            const dto = {
                title: '강남 원룸',
                address: '서울시 강남구',
                detailAddress: '101호',
                type: 'ONE_ROOM',
                transactionType: 'MONTHLY',
            };

            await service.create(dto as any, 'agent-1');

            expect(prisma.property.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        address: '서울시 강남구 101호',
                    }),
                }),
            );
        });

        it('should use address alone when no detailAddress', async () => {
            prisma.property.create.mockResolvedValue(mockProperty);

            const dto = {
                title: '강남 원룸',
                address: '서울시 강남구',
                type: 'ONE_ROOM',
                transactionType: 'MONTHLY',
            };

            await service.create(dto as any, 'agent-1');

            expect(prisma.property.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        address: '서울시 강남구',
                    }),
                }),
            );
        });
    });

    describe('findAll', () => {
        it('should return paginated properties', async () => {
            prisma.property.findMany.mockResolvedValue([mockProperty]);
            prisma.property.count.mockResolvedValue(1);

            const result = await service.findAll({ skip: 0, take: 20, agentId: 'agent-1' });

            expect(result).toEqual({
                data: [mockProperty],
                total: 1,
                page: 1,
                limit: 20,
            });
        });

        it('should apply agentId filter when provided', async () => {
            prisma.property.findMany.mockResolvedValue([]);
            prisma.property.count.mockResolvedValue(0);

            await service.findAll({ agentId: 'agent-1' });

            expect(prisma.property.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        agentId: 'agent-1',
                        deletedAt: null,
                    }),
                }),
            );
        });

        it('should filter out soft-deleted properties', async () => {
            prisma.property.findMany.mockResolvedValue([]);
            prisma.property.count.mockResolvedValue(0);

            await service.findAll({});

            expect(prisma.property.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        deletedAt: null,
                    }),
                }),
            );
        });

        it('should calculate correct page number', async () => {
            prisma.property.findMany.mockResolvedValue([]);
            prisma.property.count.mockResolvedValue(50);

            const result = await service.findAll({ skip: 20, take: 10 });

            expect(result.page).toBe(3);
            expect(result.limit).toBe(10);
        });
    });

    describe('findOne', () => {
        it('should return a property by id', async () => {
            prisma.property.findFirst.mockResolvedValue(mockProperty);

            const result = await service.findOne('prop-1');

            expect(result).toEqual(mockProperty);
        });

        it('should apply agentId filter for ownership check', async () => {
            prisma.property.findFirst.mockResolvedValue(mockProperty);

            await service.findOne('prop-1', 'agent-1');

            expect(prisma.property.findFirst).toHaveBeenCalledWith({
                where: { id: 'prop-1', deletedAt: null, agentId: 'agent-1' },
                include: { images: true },
            });
        });

        it('should throw NotFoundException when property not found', async () => {
            prisma.property.findFirst.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when agent does not own property', async () => {
            prisma.property.findFirst.mockResolvedValue(null);

            await expect(service.findOne('prop-1', 'other-agent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update property after ownership verification', async () => {
            prisma.property.findFirst.mockResolvedValue(mockProperty);
            prisma.property.update.mockResolvedValue({ ...mockProperty, title: '업데이트됨' });

            const result = await service.update('prop-1', { title: '업데이트됨' } as any, 'agent-1');

            expect(prisma.property.findFirst).toHaveBeenCalled();
            expect(prisma.property.update).toHaveBeenCalledWith({
                where: { id: 'prop-1' },
                data: { title: '업데이트됨' },
                include: { images: true },
            });
            expect(result.title).toBe('업데이트됨');
        });

        it('should throw NotFoundException when updating non-owned property', async () => {
            prisma.property.findFirst.mockResolvedValue(null);

            await expect(
                service.update('prop-1', { title: 'test' } as any, 'other-agent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should only include provided fields in update data', async () => {
            prisma.property.findFirst.mockResolvedValue(mockProperty);
            prisma.property.update.mockResolvedValue(mockProperty);

            await service.update('prop-1', { title: 'new title', deposit: 10000000 } as any, 'agent-1');

            expect(prisma.property.update).toHaveBeenCalledWith({
                where: { id: 'prop-1' },
                data: { title: 'new title', deposit: 10000000 },
                include: { images: true },
            });
        });
    });

    describe('remove', () => {
        it('should soft delete property after ownership verification', async () => {
            prisma.property.findFirst.mockResolvedValue(mockProperty);
            prisma.property.update.mockResolvedValue({ ...mockProperty, deletedAt: new Date() });

            await service.remove('prop-1', 'agent-1');

            expect(prisma.property.update).toHaveBeenCalledWith({
                where: { id: 'prop-1' },
                data: { deletedAt: expect.any(Date) },
                include: { images: true },
            });
        });

        it('should throw NotFoundException when removing non-owned property', async () => {
            prisma.property.findFirst.mockResolvedValue(null);

            await expect(service.remove('prop-1', 'other-agent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getClusters', () => {
        it('should return individual properties when zoom >= 15', async () => {
            const properties = [
                { id: 'p1', lat: 37.5, lng: 127.0, deposit: 5000000, monthlyRent: 500000, type: 'ONE_ROOM' },
            ];
            prisma.property.findMany.mockResolvedValue(properties);

            const result = await service.getClusters({
                north: 38,
                south: 37,
                east: 128,
                west: 126,
                zoom: 15,
            });

            expect(result).toEqual([{ ...properties[0], isCluster: false }]);
            expect(prisma.property.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: 'AVAILABLE',
                        deletedAt: null,
                    }),
                }),
            );
        });

        it('should return clustered data when zoom < 15', async () => {
            const clusters = [{ count: 5, lat: 37.5, lng: 127.0, minPrice: 3000000 }];
            prisma.$queryRaw.mockResolvedValue(clusters);

            const result = await service.getClusters({
                north: 38,
                south: 37,
                east: 128,
                west: 126,
                zoom: 12,
            });

            expect(result[0]).toEqual(
                expect.objectContaining({
                    count: 5,
                    lat: 37.5,
                    lng: 127.0,
                    isCluster: true,
                }),
            );
        });

        it('should return empty array when no properties in bounds', async () => {
            prisma.property.findMany.mockResolvedValue([]);

            const result = await service.getClusters({
                north: 38,
                south: 37,
                east: 128,
                west: 126,
                zoom: 16,
            });

            expect(result).toEqual([]);
        });
    });
});
