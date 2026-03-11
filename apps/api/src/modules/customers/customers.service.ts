import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
    constructor(private prisma: PrismaService) { }

    create(data: CreateCustomerDto, agentId: string) {
        return this.prisma.customer.create({
            data: {
                name: data.name,
                phone: data.phone,
                email: data.email,
                status: data.status,
                priority: data.priority,
                preferences: data.preferences,
                notes: data.notes,
                nextFollowupDate: data.nextFollowupDate ? new Date(data.nextFollowupDate) : undefined,
                agentId,
            },
        });
    }

    async findAll(agentId: string, status?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {
            agentId,
            deletedAt: null,
            ...(status ? { status } : {}),
        };

        const [data, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.customer.count({ where }),
        ]);

        return { data, total, page, limit };
    }

    async findOne(id: string, agentId: string) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, agentId, deletedAt: null },
        });

        if (!customer) {
            throw new NotFoundException('고객을 찾을 수 없습니다');
        }

        return customer;
    }

    async update(id: string, data: UpdateCustomerDto, agentId: string) {
        // Verify ownership
        await this.findOne(id, agentId);

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.preferences !== undefined) updateData.preferences = data.preferences;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.nextFollowupDate !== undefined) {
            updateData.nextFollowupDate = data.nextFollowupDate ? new Date(data.nextFollowupDate) : null;
        }

        return this.prisma.customer.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string, agentId: string) {
        // Verify ownership
        await this.findOne(id, agentId);

        // Soft delete
        return this.prisma.customer.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
