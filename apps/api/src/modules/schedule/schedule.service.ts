import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ScheduleService {
    constructor(private prisma: PrismaService) { }

    async getEvents(agentId: string) {
        const [contracts, customers] = await Promise.all([
            this.prisma.contract.findMany({
                where: { agentId, deletedAt: null },
                include: {
                    property: { select: { id: true, title: true } },
                },
            }),
            this.prisma.customer.findMany({
                where: { agentId, deletedAt: null, nextFollowupDate: { not: null } },
                select: { id: true, name: true, nextFollowupDate: true },
            }),
        ]);

        const events = [];

        for (const c of contracts) {
            if (c.endDate) {
                events.push({
                    id: `contract-end-${c.id}`,
                    title: `만기: ${c.property.title}`,
                    start: c.endDate,
                    allDay: true,
                    color: '#ef4444',
                    extendedProps: { type: 'CONTRACT_END', contractId: c.id },
                });
            }
            if (c.startDate) {
                events.push({
                    id: `contract-start-${c.id}`,
                    title: `입주: ${c.property.title}`,
                    start: c.startDate,
                    allDay: true,
                    color: '#3b82f6',
                    extendedProps: { type: 'CONTRACT_START', contractId: c.id },
                });
            }
        }

        for (const customer of customers) {
            if (customer.nextFollowupDate) {
                events.push({
                    id: `customer-followup-${customer.id}`,
                    title: `미팅: ${customer.name}`,
                    start: customer.nextFollowupDate,
                    allDay: true,
                    color: '#10b981',
                    extendedProps: { type: 'CUSTOMER_FOLLOWUP', customerId: customer.id },
                });
            }
        }

        return events;
    }
}
