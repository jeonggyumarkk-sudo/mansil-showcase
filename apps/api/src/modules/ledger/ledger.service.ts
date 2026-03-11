import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateLedgerDto } from './dto/create-ledger.dto';
import { UpdateLedgerDto } from './dto/update-ledger.dto';

@Injectable()
export class LedgerService {
    constructor(private prisma: PrismaService) { }

    create(data: CreateLedgerDto, agentId: string) {
        return this.prisma.ledgerTransaction.create({
            data: {
                type: data.type,
                amount: data.amount,
                category: data.category,
                date: new Date(data.date),
                description: data.description,
                contractId: data.contractId,
                agentId,
            },
        });
    }

    async findAll(agentId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = { agentId };

        const [data, total] = await Promise.all([
            this.prisma.ledgerTransaction.findMany({
                where,
                orderBy: { date: 'desc' },
                include: { contract: true },
                skip,
                take: limit,
            }),
            this.prisma.ledgerTransaction.count({ where }),
        ]);

        return { data, total, page, limit };
    }

    async findOne(id: string, agentId: string) {
        const transaction = await this.prisma.ledgerTransaction.findFirst({
            where: { id, agentId },
            include: { contract: true },
        });

        if (!transaction) {
            throw new NotFoundException('거래를 찾을 수 없습니다');
        }

        return transaction;
    }

    async update(id: string, data: UpdateLedgerDto, agentId: string) {
        // Verify ownership
        await this.findOne(id, agentId);

        const updateData: any = {};
        if (data.type !== undefined) updateData.type = data.type;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.date !== undefined) updateData.date = new Date(data.date);
        if (data.description !== undefined) updateData.description = data.description;
        if (data.contractId !== undefined) updateData.contractId = data.contractId;

        return this.prisma.ledgerTransaction.update({
            where: { id },
            data: updateData,
            include: { contract: true },
        });
    }

    async remove(id: string, agentId: string) {
        // Verify ownership
        await this.findOne(id, agentId);

        return this.prisma.ledgerTransaction.delete({
            where: { id },
        });
    }

    async getMonthlyStats(agentId: string, year: number, month: number) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);

        const transactions = await this.prisma.ledgerTransaction.findMany({
            where: {
                agentId,
                date: { gte: start, lte: end },
            },
        });

        const income = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return { income, expense, net: income - expense };
    }
}
