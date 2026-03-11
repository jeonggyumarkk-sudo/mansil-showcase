import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

@Injectable()
export class RequestsService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateRequestDto, agentId: string) {
        return this.prisma.clientRequest.create({
            data: {
                clientName: data.clientName,
                clientPhone: data.clientPhone,
                minDeposit: data.minDeposit,
                maxDeposit: data.maxDeposit,
                minRent: data.minRent,
                maxRent: data.maxRent,
                preferredLocations: data.preferredLocations,
                preferredTypes: data.preferredTypes,
                agentId,
            },
        });
    }

    async findAll(agentId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = { agentId };

        const [data, total] = await Promise.all([
            this.prisma.clientRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.clientRequest.count({ where }),
        ]);

        return { data, total, page, limit };
    }

    async findOne(id: string, agentId: string) {
        const request = await this.prisma.clientRequest.findFirst({
            where: { id, agentId },
        });

        if (!request) {
            throw new NotFoundException('요청을 찾을 수 없습니다');
        }

        return request;
    }

    async update(id: string, data: UpdateRequestDto, agentId: string) {
        // Verify ownership
        await this.findOne(id, agentId);

        const updateData: any = {};
        if (data.status !== undefined) updateData.status = data.status;
        if (data.clientName !== undefined) updateData.clientName = data.clientName;
        if (data.clientPhone !== undefined) updateData.clientPhone = data.clientPhone;
        if (data.minDeposit !== undefined) updateData.minDeposit = data.minDeposit;
        if (data.maxDeposit !== undefined) updateData.maxDeposit = data.maxDeposit;
        if (data.minRent !== undefined) updateData.minRent = data.minRent;
        if (data.maxRent !== undefined) updateData.maxRent = data.maxRent;
        if (data.preferredLocations !== undefined) updateData.preferredLocations = data.preferredLocations;
        if (data.preferredTypes !== undefined) updateData.preferredTypes = data.preferredTypes;

        return this.prisma.clientRequest.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string, agentId: string) {
        // Verify ownership
        await this.findOne(id, agentId);

        return this.prisma.clientRequest.delete({
            where: { id },
        });
    }

    async findMatches(id: string, agentId: string) {
        const request = await this.findOne(id, agentId);

        const where: any = {
            status: 'AVAILABLE',
            deletedAt: null,
        };

        const UNIT = 10000;

        if (request.minDeposit || request.maxDeposit) {
            where.deposit = {
                gte: (request.minDeposit || 0) * UNIT,
                lte: (request.maxDeposit || 999999999) * UNIT,
            };
        }

        if (request.minRent !== null && request.minRent !== undefined) {
            where.monthlyRent = {
                gte: (request.minRent || 0) * UNIT,
                lte: (request.maxRent || 999999999) * UNIT,
            };
        }

        if (request.preferredLocations) {
            const locations = request.preferredLocations.split(',').map(l => l.trim());
            where.OR = locations.map(loc => ({
                address: { contains: loc },
            }));
        }

        if (request.preferredTypes) {
            const types = request.preferredTypes.split(',').map(t => t.trim());
            where.type = { in: types };
        }

        return this.prisma.property.findMany({
            where,
            include: { images: true },
        });
    }
}
