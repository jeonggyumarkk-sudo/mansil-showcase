import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../../prisma.service';

describe('ContractsService', () => {
    let service: ContractsService;
    let prisma: any;

    const mockContract = {
        id: 'contract-1',
        propertyId: 'prop-1',
        customerId: 'cust-1',
        type: 'MONTHLY',
        status: 'ACTIVE',
        deposit: 5000000,
        monthlyRent: 500000,
        commission: 250000,
        contractDate: new Date('2025-01-15'),
        startDate: new Date('2025-02-01'),
        endDate: new Date('2026-01-31'),
        agentId: 'agent-1',
        deletedAt: null,
        property: { id: 'prop-1', title: '강남 원룸' },
        customer: { id: 'cust-1', name: '김철수' },
    };

    beforeEach(async () => {
        prisma = {
            contract: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                count: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContractsService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<ContractsService>(ContractsService);
    });

    describe('create', () => {
        it('should create a contract with explicit field mapping', () => {
            prisma.contract.create.mockResolvedValue(mockContract);

            const dto = {
                propertyId: 'prop-1',
                customerId: 'cust-1',
                type: 'MONTHLY',
                deposit: 5000000,
                monthlyRent: 500000,
                commission: 250000,
                contractDate: '2025-01-15',
                startDate: '2025-02-01',
                endDate: '2026-01-31',
                note: '비고',
            };

            service.create(dto as any, 'agent-1');

            expect(prisma.contract.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    propertyId: 'prop-1',
                    customerId: 'cust-1',
                    type: 'MONTHLY',
                    deposit: 5000000,
                    agentId: 'agent-1',
                    contractDate: expect.any(Date),
                    startDate: expect.any(Date),
                    endDate: expect.any(Date),
                }),
                include: {
                    property: true,
                    customer: { select: { id: true, name: true } },
                },
            });
        });

        it('should default contractDate to now when not provided', () => {
            prisma.contract.create.mockResolvedValue(mockContract);

            service.create({ propertyId: 'prop-1', type: 'MONTHLY' } as any, 'agent-1');

            expect(prisma.contract.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        contractDate: expect.any(Date),
                    }),
                }),
            );
        });

        it('should handle optional date fields as undefined', () => {
            prisma.contract.create.mockResolvedValue(mockContract);

            service.create({
                propertyId: 'prop-1',
                type: 'SALE',
                deposit: 10000000,
            } as any, 'agent-1');

            expect(prisma.contract.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        startDate: undefined,
                        endDate: undefined,
                        moveInDate: undefined,
                    }),
                }),
            );
        });
    });

    describe('findAll', () => {
        it('should return paginated contracts scoped by agentId', async () => {
            prisma.contract.findMany.mockResolvedValue([mockContract]);
            prisma.contract.count.mockResolvedValue(1);

            const result = await service.findAll('agent-1');

            expect(result).toEqual({
                data: [mockContract],
                total: 1,
                page: 1,
                limit: 20,
            });
        });

        it('should filter by agentId and deletedAt', async () => {
            prisma.contract.findMany.mockResolvedValue([]);
            prisma.contract.count.mockResolvedValue(0);

            await service.findAll('agent-1');

            expect(prisma.contract.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { agentId: 'agent-1', deletedAt: null },
                }),
            );
        });

        it('should include property and customer in results', async () => {
            prisma.contract.findMany.mockResolvedValue([]);
            prisma.contract.count.mockResolvedValue(0);

            await service.findAll('agent-1');

            expect(prisma.contract.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: {
                        property: true,
                        customer: { select: { id: true, name: true } },
                    },
                }),
            );
        });

        it('should apply pagination correctly', async () => {
            prisma.contract.findMany.mockResolvedValue([]);
            prisma.contract.count.mockResolvedValue(100);

            const result = await service.findAll('agent-1', 3, 10);

            expect(prisma.contract.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20,
                    take: 10,
                }),
            );
            expect(result.page).toBe(3);
        });
    });

    describe('findOne', () => {
        it('should return a contract by id and agentId', async () => {
            prisma.contract.findFirst.mockResolvedValue(mockContract);

            const result = await service.findOne('contract-1', 'agent-1');

            expect(result).toEqual(mockContract);
            expect(prisma.contract.findFirst).toHaveBeenCalledWith({
                where: { id: 'contract-1', agentId: 'agent-1', deletedAt: null },
                include: {
                    property: true,
                    customer: { select: { id: true, name: true } },
                },
            });
        });

        it('should throw NotFoundException when contract not found', async () => {
            prisma.contract.findFirst.mockResolvedValue(null);

            await expect(service.findOne('nonexistent', 'agent-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update contract after ownership verification', async () => {
            prisma.contract.findFirst.mockResolvedValue(mockContract);
            prisma.contract.update.mockResolvedValue({ ...mockContract, status: 'COMPLETED' });

            const result = await service.update('contract-1', { status: 'COMPLETED' } as any, 'agent-1');

            expect(prisma.contract.update).toHaveBeenCalledWith({
                where: { id: 'contract-1' },
                data: { status: 'COMPLETED' },
                include: {
                    property: true,
                    customer: { select: { id: true, name: true } },
                },
            });
            expect(result.status).toBe('COMPLETED');
        });

        it('should throw NotFoundException for non-owned contract', async () => {
            prisma.contract.findFirst.mockResolvedValue(null);

            await expect(
                service.update('contract-1', { status: 'COMPLETED' } as any, 'other-agent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should convert date strings to Date objects', async () => {
            prisma.contract.findFirst.mockResolvedValue(mockContract);
            prisma.contract.update.mockResolvedValue(mockContract);

            await service.update('contract-1', {
                startDate: '2025-03-01',
                endDate: '2026-02-28',
            } as any, 'agent-1');

            expect(prisma.contract.update).toHaveBeenCalledWith({
                where: { id: 'contract-1' },
                data: {
                    startDate: expect.any(Date),
                    endDate: expect.any(Date),
                },
                include: expect.anything(),
            });
        });
    });

    describe('remove', () => {
        it('should soft delete contract after ownership verification', async () => {
            prisma.contract.findFirst.mockResolvedValue(mockContract);
            prisma.contract.update.mockResolvedValue({ ...mockContract, deletedAt: new Date() });

            await service.remove('contract-1', 'agent-1');

            expect(prisma.contract.update).toHaveBeenCalledWith({
                where: { id: 'contract-1' },
                data: { deletedAt: expect.any(Date) },
            });
        });

        it('should throw NotFoundException when removing non-owned contract', async () => {
            prisma.contract.findFirst.mockResolvedValue(null);

            await expect(service.remove('contract-1', 'other-agent')).rejects.toThrow(NotFoundException);
        });
    });
});
