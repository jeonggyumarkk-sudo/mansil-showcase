import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../../prisma.service';

describe('LedgerService', () => {
    let service: LedgerService;
    let prisma: any;

    const mockTransaction = {
        id: 'txn-1',
        type: 'INCOME',
        amount: 250000,
        category: 'COMMISSION',
        date: new Date('2025-01-15'),
        description: '중개수수료',
        contractId: 'contract-1',
        agentId: 'agent-1',
        contract: { id: 'contract-1' },
    };

    beforeEach(async () => {
        prisma = {
            ledgerTransaction: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LedgerService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<LedgerService>(LedgerService);
    });

    describe('create', () => {
        it('should create a ledger transaction with correct data', () => {
            prisma.ledgerTransaction.create.mockResolvedValue(mockTransaction);

            const dto = {
                type: 'INCOME',
                amount: 250000,
                category: 'COMMISSION',
                date: '2025-01-15',
                description: '중개수수료',
                contractId: 'contract-1',
            };

            service.create(dto as any, 'agent-1');

            expect(prisma.ledgerTransaction.create).toHaveBeenCalledWith({
                data: {
                    type: 'INCOME',
                    amount: 250000,
                    category: 'COMMISSION',
                    date: expect.any(Date),
                    description: '중개수수료',
                    contractId: 'contract-1',
                    agentId: 'agent-1',
                },
            });
        });
    });

    describe('findAll', () => {
        it('should return paginated transactions scoped by agentId', async () => {
            prisma.ledgerTransaction.findMany.mockResolvedValue([mockTransaction]);
            prisma.ledgerTransaction.count.mockResolvedValue(1);

            const result = await service.findAll('agent-1');

            expect(result).toEqual({
                data: [mockTransaction],
                total: 1,
                page: 1,
                limit: 20,
            });
            expect(prisma.ledgerTransaction.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { agentId: 'agent-1' },
                    orderBy: { date: 'desc' },
                    include: { contract: true },
                }),
            );
        });

        it('should apply pagination', async () => {
            prisma.ledgerTransaction.findMany.mockResolvedValue([]);
            prisma.ledgerTransaction.count.mockResolvedValue(50);

            const result = await service.findAll('agent-1', 2, 10);

            expect(prisma.ledgerTransaction.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10,
                }),
            );
            expect(result.page).toBe(2);
        });
    });

    describe('findOne', () => {
        it('should return a transaction by id and agentId', async () => {
            prisma.ledgerTransaction.findFirst.mockResolvedValue(mockTransaction);

            const result = await service.findOne('txn-1', 'agent-1');

            expect(result).toEqual(mockTransaction);
            expect(prisma.ledgerTransaction.findFirst).toHaveBeenCalledWith({
                where: { id: 'txn-1', agentId: 'agent-1' },
                include: { contract: true },
            });
        });

        it('should throw NotFoundException when transaction not found', async () => {
            prisma.ledgerTransaction.findFirst.mockResolvedValue(null);

            await expect(service.findOne('nonexistent', 'agent-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update transaction after ownership verification', async () => {
            prisma.ledgerTransaction.findFirst.mockResolvedValue(mockTransaction);
            prisma.ledgerTransaction.update.mockResolvedValue({ ...mockTransaction, amount: 300000 });

            const result = await service.update('txn-1', { amount: 300000 } as any, 'agent-1');

            expect(prisma.ledgerTransaction.update).toHaveBeenCalledWith({
                where: { id: 'txn-1' },
                data: { amount: 300000 },
                include: { contract: true },
            });
            expect(result.amount).toBe(300000);
        });

        it('should throw NotFoundException for non-owned transaction', async () => {
            prisma.ledgerTransaction.findFirst.mockResolvedValue(null);

            await expect(
                service.update('txn-1', { amount: 300000 } as any, 'other-agent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should convert date string to Date object', async () => {
            prisma.ledgerTransaction.findFirst.mockResolvedValue(mockTransaction);
            prisma.ledgerTransaction.update.mockResolvedValue(mockTransaction);

            await service.update('txn-1', { date: '2025-06-01' } as any, 'agent-1');

            expect(prisma.ledgerTransaction.update).toHaveBeenCalledWith({
                where: { id: 'txn-1' },
                data: { date: expect.any(Date) },
                include: { contract: true },
            });
        });

        it('should only include provided fields', async () => {
            prisma.ledgerTransaction.findFirst.mockResolvedValue(mockTransaction);
            prisma.ledgerTransaction.update.mockResolvedValue(mockTransaction);

            await service.update('txn-1', { category: 'RENT' } as any, 'agent-1');

            expect(prisma.ledgerTransaction.update).toHaveBeenCalledWith({
                where: { id: 'txn-1' },
                data: { category: 'RENT' },
                include: { contract: true },
            });
        });
    });

    describe('remove', () => {
        it('should hard delete transaction after ownership verification', async () => {
            prisma.ledgerTransaction.findFirst.mockResolvedValue(mockTransaction);
            prisma.ledgerTransaction.delete.mockResolvedValue(mockTransaction);

            await service.remove('txn-1', 'agent-1');

            expect(prisma.ledgerTransaction.delete).toHaveBeenCalledWith({
                where: { id: 'txn-1' },
            });
        });

        it('should throw NotFoundException for non-owned transaction', async () => {
            prisma.ledgerTransaction.findFirst.mockResolvedValue(null);

            await expect(service.remove('txn-1', 'other-agent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getMonthlyStats', () => {
        it('should calculate income and expense totals', async () => {
            prisma.ledgerTransaction.findMany.mockResolvedValue([
                { type: 'INCOME', amount: 250000 },
                { type: 'INCOME', amount: 500000 },
                { type: 'EXPENSE', amount: 100000 },
                { type: 'EXPENSE', amount: 50000 },
            ]);

            const result = await service.getMonthlyStats('agent-1', 2025, 1);

            expect(result).toEqual({
                income: 750000,
                expense: 150000,
                net: 600000,
            });
        });

        it('should return zeros for months with no transactions', async () => {
            prisma.ledgerTransaction.findMany.mockResolvedValue([]);

            const result = await service.getMonthlyStats('agent-1', 2025, 6);

            expect(result).toEqual({
                income: 0,
                expense: 0,
                net: 0,
            });
        });

        it('should handle income-only month', async () => {
            prisma.ledgerTransaction.findMany.mockResolvedValue([
                { type: 'INCOME', amount: 1000000 },
            ]);

            const result = await service.getMonthlyStats('agent-1', 2025, 3);

            expect(result).toEqual({
                income: 1000000,
                expense: 0,
                net: 1000000,
            });
        });

        it('should handle expense-only month', async () => {
            prisma.ledgerTransaction.findMany.mockResolvedValue([
                { type: 'EXPENSE', amount: 200000 },
            ]);

            const result = await service.getMonthlyStats('agent-1', 2025, 3);

            expect(result).toEqual({
                income: 0,
                expense: 200000,
                net: -200000,
            });
        });

        it('should filter by correct date range', async () => {
            prisma.ledgerTransaction.findMany.mockResolvedValue([]);

            await service.getMonthlyStats('agent-1', 2025, 3);

            expect(prisma.ledgerTransaction.findMany).toHaveBeenCalledWith({
                where: {
                    agentId: 'agent-1',
                    date: {
                        gte: new Date(2025, 2, 1),
                        lte: new Date(2025, 3, 0),
                    },
                },
            });
        });
    });
});
