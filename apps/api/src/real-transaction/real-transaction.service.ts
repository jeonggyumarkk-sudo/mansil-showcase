import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RealTransactionService {
    constructor(private prisma: PrismaService) { }

    async getTransactions(bounds: { north: number; south: number; east: number; west: number }) {
        const { north, south, east, west } = bounds;

        return this.prisma.realTransaction.findMany({
            where: {
                lat: { lte: north, gte: south },
                lng: { lte: east, gte: west },
            },
            take: 100,
        });
    }

    async findOne(id: string) {
        const transaction = await this.prisma.realTransaction.findUnique({
            where: { id },
        });

        if (!transaction) {
            throw new NotFoundException('실거래 데이터를 찾을 수 없습니다');
        }

        return transaction;
    }
}
