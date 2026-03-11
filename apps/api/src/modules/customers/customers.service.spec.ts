import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../prisma.service';

describe('CustomersService', () => {
    let service: CustomersService;
    let prisma: any;

    const mockCustomer = {
        id: 'cust-1',
        name: '김철수',
        phone: '010-1234-5678',
        email: 'customer@example.com',
        status: 'ACTIVE',
        priority: 'HIGH',
        preferences: '강남 선호',
        notes: '예산 5000만',
        nextFollowupDate: new Date('2025-03-01'),
        agentId: 'agent-1',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        prisma = {
            customer: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                count: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CustomersService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<CustomersService>(CustomersService);
    });

    describe('create', () => {
        it('should create a customer with correct data', () => {
            prisma.customer.create.mockResolvedValue(mockCustomer);

            const dto = {
                name: '김철수',
                phone: '010-1234-5678',
                email: 'customer@example.com',
                status: 'ACTIVE',
                priority: 'HIGH',
                preferences: '강남 선호',
                notes: '예산 5000만',
                nextFollowupDate: '2025-03-01',
            };

            service.create(dto as any, 'agent-1');

            expect(prisma.customer.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: '김철수',
                    agentId: 'agent-1',
                    nextFollowupDate: expect.any(Date),
                }),
            });
        });

        it('should handle undefined nextFollowupDate', () => {
            prisma.customer.create.mockResolvedValue(mockCustomer);

            service.create({ name: '김철수' } as any, 'agent-1');

            expect(prisma.customer.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: '김철수',
                    nextFollowupDate: undefined,
                }),
            });
        });
    });

    describe('findAll', () => {
        it('should return paginated customers scoped by agentId', async () => {
            prisma.customer.findMany.mockResolvedValue([mockCustomer]);
            prisma.customer.count.mockResolvedValue(1);

            const result = await service.findAll('agent-1');

            expect(result).toEqual({
                data: [mockCustomer],
                total: 1,
                page: 1,
                limit: 20,
            });
            expect(prisma.customer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        agentId: 'agent-1',
                        deletedAt: null,
                    }),
                }),
            );
        });

        it('should filter by status when provided', async () => {
            prisma.customer.findMany.mockResolvedValue([]);
            prisma.customer.count.mockResolvedValue(0);

            await service.findAll('agent-1', 'ACTIVE');

            expect(prisma.customer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        agentId: 'agent-1',
                        status: 'ACTIVE',
                        deletedAt: null,
                    }),
                }),
            );
        });

        it('should apply pagination correctly', async () => {
            prisma.customer.findMany.mockResolvedValue([]);
            prisma.customer.count.mockResolvedValue(50);

            const result = await service.findAll('agent-1', undefined, 3, 10);

            expect(prisma.customer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20,
                    take: 10,
                }),
            );
            expect(result.page).toBe(3);
            expect(result.limit).toBe(10);
        });

        it('should filter out soft-deleted customers', async () => {
            prisma.customer.findMany.mockResolvedValue([]);
            prisma.customer.count.mockResolvedValue(0);

            await service.findAll('agent-1');

            expect(prisma.customer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ deletedAt: null }),
                }),
            );
        });
    });

    describe('findOne', () => {
        it('should return a customer by id and agentId', async () => {
            prisma.customer.findFirst.mockResolvedValue(mockCustomer);

            const result = await service.findOne('cust-1', 'agent-1');

            expect(result).toEqual(mockCustomer);
            expect(prisma.customer.findFirst).toHaveBeenCalledWith({
                where: { id: 'cust-1', agentId: 'agent-1', deletedAt: null },
            });
        });

        it('should throw NotFoundException when customer not found', async () => {
            prisma.customer.findFirst.mockResolvedValue(null);

            await expect(service.findOne('nonexistent', 'agent-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException for wrong agentId', async () => {
            prisma.customer.findFirst.mockResolvedValue(null);

            await expect(service.findOne('cust-1', 'other-agent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update customer after ownership verification', async () => {
            prisma.customer.findFirst.mockResolvedValue(mockCustomer);
            prisma.customer.update.mockResolvedValue({ ...mockCustomer, name: '이영희' });

            const result = await service.update('cust-1', { name: '이영희' } as any, 'agent-1');

            expect(prisma.customer.update).toHaveBeenCalledWith({
                where: { id: 'cust-1' },
                data: { name: '이영희' },
            });
            expect(result.name).toBe('이영희');
        });

        it('should throw NotFoundException when customer not owned', async () => {
            prisma.customer.findFirst.mockResolvedValue(null);

            await expect(
                service.update('cust-1', { name: 'test' } as any, 'other-agent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should handle nextFollowupDate conversion', async () => {
            prisma.customer.findFirst.mockResolvedValue(mockCustomer);
            prisma.customer.update.mockResolvedValue(mockCustomer);

            await service.update('cust-1', { nextFollowupDate: '2025-06-01' } as any, 'agent-1');

            expect(prisma.customer.update).toHaveBeenCalledWith({
                where: { id: 'cust-1' },
                data: { nextFollowupDate: expect.any(Date) },
            });
        });

        it('should set nextFollowupDate to null when empty string', async () => {
            prisma.customer.findFirst.mockResolvedValue(mockCustomer);
            prisma.customer.update.mockResolvedValue(mockCustomer);

            await service.update('cust-1', { nextFollowupDate: '' } as any, 'agent-1');

            expect(prisma.customer.update).toHaveBeenCalledWith({
                where: { id: 'cust-1' },
                data: { nextFollowupDate: null },
            });
        });

        it('should only update provided fields', async () => {
            prisma.customer.findFirst.mockResolvedValue(mockCustomer);
            prisma.customer.update.mockResolvedValue(mockCustomer);

            await service.update('cust-1', { phone: '010-9999-9999' } as any, 'agent-1');

            expect(prisma.customer.update).toHaveBeenCalledWith({
                where: { id: 'cust-1' },
                data: { phone: '010-9999-9999' },
            });
        });
    });

    describe('remove', () => {
        it('should soft delete customer after ownership verification', async () => {
            prisma.customer.findFirst.mockResolvedValue(mockCustomer);
            prisma.customer.update.mockResolvedValue({ ...mockCustomer, deletedAt: new Date() });

            await service.remove('cust-1', 'agent-1');

            expect(prisma.customer.update).toHaveBeenCalledWith({
                where: { id: 'cust-1' },
                data: { deletedAt: expect.any(Date) },
            });
        });

        it('should throw NotFoundException when removing non-owned customer', async () => {
            prisma.customer.findFirst.mockResolvedValue(null);

            await expect(service.remove('cust-1', 'other-agent')).rejects.toThrow(NotFoundException);
        });
    });
});
