import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { PrismaService } from '../../prisma.service';

describe('RequestsService', () => {
    let service: RequestsService;
    let prisma: any;

    const mockRequest = {
        id: 'req-1',
        clientName: '박영희',
        clientPhone: '010-5678-1234',
        minDeposit: 1000,
        maxDeposit: 5000,
        minRent: 30,
        maxRent: 60,
        preferredLocations: '강남, 서초',
        preferredTypes: 'ONE_ROOM, OFFICETEL',
        agentId: 'agent-1',
        createdAt: new Date(),
    };

    beforeEach(async () => {
        const mockPrismaService = {
            clientRequest: {
                findFirst: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            property: {
                findMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RequestsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<RequestsService>(RequestsService);
        prisma = module.get(PrismaService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a client request with correct data', async () => {
            prisma.clientRequest.create.mockResolvedValue(mockRequest);

            const dto = {
                clientName: '박영희',
                clientPhone: '010-5678-1234',
                minDeposit: 1000,
                maxDeposit: 5000,
                minRent: 30,
                maxRent: 60,
                preferredLocations: '강남, 서초',
                preferredTypes: 'ONE_ROOM, OFFICETEL',
            };

            const result = await service.create(dto as any, 'agent-1');

            expect(prisma.clientRequest.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    clientName: '박영희',
                    clientPhone: '010-5678-1234',
                    agentId: 'agent-1',
                }),
            });
            expect(result).toEqual(mockRequest);
        });
    });

    describe('findAll', () => {
        it('should return paginated requests scoped by agentId', async () => {
            prisma.clientRequest.findMany.mockResolvedValue([mockRequest]);
            prisma.clientRequest.count.mockResolvedValue(1);

            const result = await service.findAll('agent-1');

            expect(result).toEqual({
                data: [mockRequest],
                total: 1,
                page: 1,
                limit: 20,
            });
        });

        it('should apply pagination', async () => {
            prisma.clientRequest.findMany.mockResolvedValue([]);
            prisma.clientRequest.count.mockResolvedValue(50);

            const result = await service.findAll('agent-1', 3, 10);

            expect(prisma.clientRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20,
                    take: 10,
                }),
            );
            expect(result.page).toBe(3);
        });

        it('should scope by agentId', async () => {
            prisma.clientRequest.findMany.mockResolvedValue([]);
            prisma.clientRequest.count.mockResolvedValue(0);

            await service.findAll('agent-1');

            expect(prisma.clientRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { agentId: 'agent-1' },
                }),
            );
        });
    });

    describe('findOne', () => {
        it('should return a request by id and agentId', async () => {
            prisma.clientRequest.findFirst.mockResolvedValue(mockRequest);

            const result = await service.findOne('req-1', 'agent-1');

            expect(result).toEqual(mockRequest);
            expect(prisma.clientRequest.findFirst).toHaveBeenCalledWith({
                where: { id: 'req-1', agentId: 'agent-1' },
            });
        });

        it('should throw NotFoundException when not found', async () => {
            prisma.clientRequest.findFirst.mockResolvedValue(null);

            await expect(service.findOne('nonexistent', 'agent-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update request after ownership verification', async () => {
            prisma.clientRequest.findFirst.mockResolvedValue(mockRequest);
            prisma.clientRequest.update.mockResolvedValue({ ...mockRequest, status: 'COMPLETED' });

            const result = await service.update('req-1', { status: 'COMPLETED' } as any, 'agent-1');

            expect(prisma.clientRequest.update).toHaveBeenCalledWith({
                where: { id: 'req-1' },
                data: { status: 'COMPLETED' },
            });
            expect(result.status).toBe('COMPLETED');
        });

        it('should throw NotFoundException for non-owned request', async () => {
            prisma.clientRequest.findFirst.mockResolvedValue(null);

            await expect(
                service.update('req-1', { status: 'COMPLETED' } as any, 'other-agent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should only include provided fields', async () => {
            prisma.clientRequest.findFirst.mockResolvedValue(mockRequest);
            prisma.clientRequest.update.mockResolvedValue(mockRequest);

            await service.update('req-1', { clientName: '새이름', minDeposit: 2000 } as any, 'agent-1');

            expect(prisma.clientRequest.update).toHaveBeenCalledWith({
                where: { id: 'req-1' },
                data: { clientName: '새이름', minDeposit: 2000 },
            });
        });
    });

    describe('remove', () => {
        it('should delete request after ownership verification', async () => {
            prisma.clientRequest.findFirst.mockResolvedValue(mockRequest);
            prisma.clientRequest.delete.mockResolvedValue(mockRequest);

            await service.remove('req-1', 'agent-1');

            expect(prisma.clientRequest.delete).toHaveBeenCalledWith({
                where: { id: 'req-1' },
            });
        });

        it('should throw NotFoundException for non-owned request', async () => {
            prisma.clientRequest.findFirst.mockResolvedValue(null);

            await expect(service.remove('req-1', 'other-agent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findMatches', () => {
        it('should return matching properties based on price range', async () => {
            const mockRequestData = {
                id: '1',
                agentId: 'agent-1',
                minDeposit: 1000,
                maxDeposit: 5000,
                minRent: 0,
                maxRent: 50,
                preferredLocations: null,
                preferredTypes: null,
            };

            prisma.clientRequest.findFirst.mockResolvedValue(mockRequestData);
            prisma.property.findMany.mockResolvedValue([]);

            await service.findMatches('1', 'agent-1');

            expect(prisma.property.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        deposit: {
                            gte: 10000000,
                            lte: 50000000,
                        },
                        monthlyRent: {
                            gte: 0,
                            lte: 500000,
                        },
                    }),
                }),
            );
        });

        it('should return matching properties based on location', async () => {
            const mockRequestData = {
                id: '2',
                agentId: 'agent-1',
                preferredLocations: 'Gangnam, Seocho',
                preferredTypes: null,
                minDeposit: null,
                maxDeposit: null,
                minRent: null,
                maxRent: null,
            };

            prisma.clientRequest.findFirst.mockResolvedValue(mockRequestData);
            prisma.property.findMany.mockResolvedValue([]);

            await service.findMatches('2', 'agent-1');

            expect(prisma.property.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: [
                            { address: { contains: 'Gangnam' } },
                            { address: { contains: 'Seocho' } },
                        ],
                    }),
                }),
            );
        });

        it('should filter by property types', async () => {
            const mockRequestData = {
                id: '3',
                agentId: 'agent-1',
                preferredLocations: null,
                preferredTypes: 'ONE_ROOM, OFFICETEL',
                minDeposit: null,
                maxDeposit: null,
                minRent: null,
                maxRent: null,
            };

            prisma.clientRequest.findFirst.mockResolvedValue(mockRequestData);
            prisma.property.findMany.mockResolvedValue([]);

            await service.findMatches('3', 'agent-1');

            expect(prisma.property.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        type: { in: ['ONE_ROOM', 'OFFICETEL'] },
                    }),
                }),
            );
        });

        it('should always filter by AVAILABLE status and non-deleted', async () => {
            const mockRequestData = {
                id: '4',
                agentId: 'agent-1',
                preferredLocations: null,
                preferredTypes: null,
                minDeposit: null,
                maxDeposit: null,
                minRent: null,
                maxRent: null,
            };

            prisma.clientRequest.findFirst.mockResolvedValue(mockRequestData);
            prisma.property.findMany.mockResolvedValue([]);

            await service.findMatches('4', 'agent-1');

            expect(prisma.property.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: 'AVAILABLE',
                        deletedAt: null,
                    }),
                }),
            );
        });

        it('should throw NotFoundException when request not found', async () => {
            prisma.clientRequest.findFirst.mockResolvedValue(null);

            await expect(service.findMatches('nonexistent', 'agent-1')).rejects.toThrow(NotFoundException);
        });

        it('should include images in matched properties', async () => {
            const mockRequestData = {
                id: '5',
                agentId: 'agent-1',
                preferredLocations: null,
                preferredTypes: null,
                minDeposit: null,
                maxDeposit: null,
                minRent: null,
                maxRent: null,
            };

            prisma.clientRequest.findFirst.mockResolvedValue(mockRequestData);
            prisma.property.findMany.mockResolvedValue([]);

            await service.findMatches('5', 'agent-1');

            expect(prisma.property.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: { images: true },
                }),
            );
        });
    });
});
