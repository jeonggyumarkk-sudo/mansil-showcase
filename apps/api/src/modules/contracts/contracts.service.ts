import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
    constructor(private prisma: PrismaService) { }

    create(data: CreateContractDto, agentId: string) {
        return this.prisma.contract.create({
            data: {
                propertyId: data.propertyId,
                customerId: data.customerId,
                type: data.type,
                deposit: data.deposit,
                monthlyRent: data.monthlyRent,
                salePrice: data.salePrice,
                commission: data.commission,
                contractDate: data.contractDate ? new Date(data.contractDate) : new Date(),
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
                note: data.note,
                pdfUrl: data.pdfUrl,
                agentId,
            },
            include: {
                property: true,
                customer: { select: { id: true, name: true } },
            },
        });
    }

    async findAll(agentId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = { agentId, deletedAt: null };

        const [data, total] = await Promise.all([
            this.prisma.contract.findMany({
                where,
                include: {
                    property: true,
                    customer: { select: { id: true, name: true } },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.contract.count({ where }),
        ]);

        return { data, total, page, limit };
    }

    async findOne(id: string, agentId: string) {
        const contract = await this.prisma.contract.findFirst({
            where: { id, agentId, deletedAt: null },
            include: {
                property: true,
                customer: { select: { id: true, name: true } },
            },
        });

        if (!contract) {
            throw new NotFoundException('계약을 찾을 수 없습니다');
        }

        return contract;
    }

    async update(id: string, data: UpdateContractDto, agentId: string) {
        // Verify ownership
        await this.findOne(id, agentId);

        const updateData: any = {};
        if (data.type !== undefined) updateData.type = data.type;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.deposit !== undefined) updateData.deposit = data.deposit;
        if (data.monthlyRent !== undefined) updateData.monthlyRent = data.monthlyRent;
        if (data.salePrice !== undefined) updateData.salePrice = data.salePrice;
        if (data.commission !== undefined) updateData.commission = data.commission;
        if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
        if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
        if (data.moveInDate !== undefined) updateData.moveInDate = new Date(data.moveInDate);
        if (data.note !== undefined) updateData.note = data.note;
        if (data.pdfUrl !== undefined) updateData.pdfUrl = data.pdfUrl;

        return this.prisma.contract.update({
            where: { id },
            data: updateData,
            include: {
                property: true,
                customer: { select: { id: true, name: true } },
            },
        });
    }

    async remove(id: string, agentId: string) {
        // Verify ownership
        await this.findOne(id, agentId);

        // Soft delete
        return this.prisma.contract.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
