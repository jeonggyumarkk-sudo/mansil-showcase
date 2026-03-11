import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../../prisma.service';

describe('ScheduleService', () => {
    let service: ScheduleService;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            contract: {
                findMany: jest.fn(),
            },
            customer: {
                findMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScheduleService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<ScheduleService>(ScheduleService);
    });

    describe('getEvents', () => {
        it('should return combined contract and customer events', async () => {
            const mockContracts = [
                {
                    id: 'contract-1',
                    startDate: new Date('2025-02-01'),
                    endDate: new Date('2026-01-31'),
                    property: { id: 'prop-1', title: '강남 원룸' },
                },
            ];
            const mockCustomers = [
                {
                    id: 'cust-1',
                    name: '김철수',
                    nextFollowupDate: new Date('2025-03-15'),
                },
            ];

            prisma.contract.findMany.mockResolvedValue(mockContracts);
            prisma.customer.findMany.mockResolvedValue(mockCustomers);

            const result = await service.getEvents('agent-1');

            expect(result).toHaveLength(3);
            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: 'contract-end-contract-1',
                        title: '만기: 강남 원룸',
                        color: '#ef4444',
                        extendedProps: { type: 'CONTRACT_END', contractId: 'contract-1' },
                    }),
                    expect.objectContaining({
                        id: 'contract-start-contract-1',
                        title: '입주: 강남 원룸',
                        color: '#3b82f6',
                        extendedProps: { type: 'CONTRACT_START', contractId: 'contract-1' },
                    }),
                    expect.objectContaining({
                        id: 'customer-followup-cust-1',
                        title: '미팅: 김철수',
                        color: '#10b981',
                        extendedProps: { type: 'CUSTOMER_FOLLOWUP', customerId: 'cust-1' },
                    }),
                ]),
            );
        });

        it('should handle contracts without endDate or startDate', async () => {
            const mockContracts = [
                {
                    id: 'contract-1',
                    startDate: null,
                    endDate: null,
                    property: { id: 'prop-1', title: '매매 물건' },
                },
            ];

            prisma.contract.findMany.mockResolvedValue(mockContracts);
            prisma.customer.findMany.mockResolvedValue([]);

            const result = await service.getEvents('agent-1');

            expect(result).toHaveLength(0);
        });

        it('should handle empty results', async () => {
            prisma.contract.findMany.mockResolvedValue([]);
            prisma.customer.findMany.mockResolvedValue([]);

            const result = await service.getEvents('agent-1');

            expect(result).toEqual([]);
        });

        it('should filter contracts by agentId and non-deleted', async () => {
            prisma.contract.findMany.mockResolvedValue([]);
            prisma.customer.findMany.mockResolvedValue([]);

            await service.getEvents('agent-1');

            expect(prisma.contract.findMany).toHaveBeenCalledWith({
                where: { agentId: 'agent-1', deletedAt: null },
                include: {
                    property: { select: { id: true, title: true } },
                },
            });
        });

        it('should filter customers by agentId, non-deleted, and having followup date', async () => {
            prisma.contract.findMany.mockResolvedValue([]);
            prisma.customer.findMany.mockResolvedValue([]);

            await service.getEvents('agent-1');

            expect(prisma.customer.findMany).toHaveBeenCalledWith({
                where: {
                    agentId: 'agent-1',
                    deletedAt: null,
                    nextFollowupDate: { not: null },
                },
                select: { id: true, name: true, nextFollowupDate: true },
            });
        });

        it('should set allDay to true for all events', async () => {
            prisma.contract.findMany.mockResolvedValue([
                {
                    id: 'c1',
                    startDate: new Date(),
                    endDate: new Date(),
                    property: { id: 'p1', title: 'Test' },
                },
            ]);
            prisma.customer.findMany.mockResolvedValue([
                { id: 'cu1', name: 'Test', nextFollowupDate: new Date() },
            ]);

            const result = await service.getEvents('agent-1');

            result.forEach(event => {
                expect(event.allDay).toBe(true);
            });
        });

        it('should create contract-only end event when startDate is missing', async () => {
            prisma.contract.findMany.mockResolvedValue([
                {
                    id: 'c1',
                    startDate: null,
                    endDate: new Date('2026-01-31'),
                    property: { id: 'p1', title: '전세 아파트' },
                },
            ]);
            prisma.customer.findMany.mockResolvedValue([]);

            const result = await service.getEvents('agent-1');

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('contract-end-c1');
        });
    });
});
