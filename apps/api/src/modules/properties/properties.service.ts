import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PropertyStatus } from '@mansil/types';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreatePropertyDto, agentId: string) {
        const { detailAddress, ...rest } = data;
        const address = detailAddress ? `${rest.address} ${detailAddress}` : rest.address;

        return this.prisma.property.create({
            data: {
                title: rest.title,
                description: rest.description,
                type: rest.type,
                transactionType: rest.transactionType,
                status: PropertyStatus.AVAILABLE,
                deposit: rest.deposit,
                monthlyRent: rest.monthlyRent,
                maintenanceFee: rest.maintenanceFee,
                salePrice: rest.salePrice,
                areaPyeong: rest.areaPyeong,
                floor: rest.floor,
                totalFloors: rest.totalFloors,
                roomCount: rest.roomCount,
                bathroomCount: rest.bathroomCount,
                address,
                roadAddress: rest.roadAddress || rest.address,
                lat: rest.lat,
                lng: rest.lng,
                agentId,
            },
            include: { images: true },
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
        agentId?: string;
    }) {
        const { skip, take, where, orderBy, agentId } = params;
        const finalWhere = {
            ...where,
            deletedAt: null,
            ...(agentId ? { agentId } : {}),
        };

        const [data, total] = await Promise.all([
            this.prisma.property.findMany({
                skip,
                take,
                where: finalWhere,
                orderBy,
                include: { images: true },
            }),
            this.prisma.property.count({ where: finalWhere }),
        ]);

        return { data, total, page: skip !== undefined && take ? Math.floor(skip / take) + 1 : 1, limit: take || 20 };
    }

    async findOne(id: string, agentId?: string) {
        const where: any = { id, deletedAt: null };
        if (agentId) where.agentId = agentId;

        const property = await this.prisma.property.findFirst({
            where,
            include: { images: true },
        });

        if (!property) {
            throw new NotFoundException('매물을 찾을 수 없습니다');
        }

        return property;
    }

    async update(id: string, data: UpdatePropertyDto, agentId: string) {
        // Verify ownership
        await this.findOne(id, agentId);

        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.transactionType !== undefined) updateData.transactionType = data.transactionType;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.deposit !== undefined) updateData.deposit = data.deposit;
        if (data.monthlyRent !== undefined) updateData.monthlyRent = data.monthlyRent;
        if (data.maintenanceFee !== undefined) updateData.maintenanceFee = data.maintenanceFee;
        if (data.salePrice !== undefined) updateData.salePrice = data.salePrice;
        if (data.areaPyeong !== undefined) updateData.areaPyeong = data.areaPyeong;
        if (data.floor !== undefined) updateData.floor = data.floor;
        if (data.totalFloors !== undefined) updateData.totalFloors = data.totalFloors;
        if (data.roomCount !== undefined) updateData.roomCount = data.roomCount;
        if (data.bathroomCount !== undefined) updateData.bathroomCount = data.bathroomCount;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.roadAddress !== undefined) updateData.roadAddress = data.roadAddress;
        if (data.lat !== undefined) updateData.lat = data.lat;
        if (data.lng !== undefined) updateData.lng = data.lng;

        return this.prisma.property.update({
            where: { id },
            data: updateData,
            include: { images: true },
        });
    }

    async remove(id: string, agentId: string) {
        // Verify ownership
        await this.findOne(id, agentId);

        // Soft delete
        return this.prisma.property.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: { images: true },
        });
    }

    async getClusters(bounds: { north: number; south: number; east: number; west: number; zoom: number }) {
        const { north, south, east, west, zoom } = bounds;

        // If zoom is high enough, return individual properties
        if (zoom >= 15) {
            const properties = await this.prisma.property.findMany({
                where: {
                    lat: { lte: north, gte: south },
                    lng: { lte: east, gte: west },
                    status: 'AVAILABLE',
                    deletedAt: null,
                },
                select: { id: true, lat: true, lng: true, deposit: true, monthlyRent: true, type: true },
            });
            return properties.map(p => ({ ...p, isCluster: false }));
        }

        // Clustering Logic
        const gridSize = 0.5 / Math.pow(2, zoom - 10);

        const clusters: any[] = await this.prisma.$queryRaw`
            SELECT
                CAST(count(*) AS INTEGER) as count,
                avg(lat) as lat,
                avg(lng) as lng,
                min(deposit) as minPrice
            FROM Property
            WHERE lat <= ${north} AND lat >= ${south}
              AND lng <= ${east} AND lng >= ${west}
              AND status = 'AVAILABLE'
              AND deletedAt IS NULL
            GROUP BY cast(lat / ${gridSize} as int), cast(lng / ${gridSize} as int)
        `;

        return clusters.map(c => ({
            id: `cluster-${c.lat}-${c.lng}`,
            lat: c.lat,
            lng: c.lng,
            count: Number(c.count),
            minPrice: Number(c.minPrice),
            isCluster: true,
        }));
    }
}
