import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyType, TransactionType } from '@mansil/types';

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) { }

    @Get('map/clusters')
    getClusters(
        @Query('north') north: string,
        @Query('south') south: string,
        @Query('east') east: string,
        @Query('west') west: string,
        @Query('zoom') zoom: string,
    ) {
        return this.propertiesService.getClusters({
            north: Number(north),
            south: Number(south),
            east: Number(east),
            west: Number(west),
            zoom: Number(zoom),
        });
    }

    @Post()
    create(@Body() createPropertyDto: CreatePropertyDto, @CurrentUser() user: any) {
        return this.propertiesService.create(createPropertyDto, user.id);
    }

    @Get()
    findAll(
        @Query('type') type?: PropertyType,
        @Query('transactionType') transactionType?: TransactionType,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @CurrentUser() user?: any,
    ) {
        const where: any = {};
        if (type) where.type = type;
        if (transactionType) where.transactionType = transactionType;

        if (minPrice || maxPrice) {
            where.deposit = {};
            if (minPrice) where.deposit.gte = Number(minPrice);
            if (maxPrice) where.deposit.lte = Number(maxPrice);
        }

        const pageNum = Number(page) || 1;
        const limitNum = Math.min(Number(limit) || 20, 100);
        const skip = (pageNum - 1) * limitNum;

        return this.propertiesService.findAll({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
            agentId: user?.id,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.propertiesService.findOne(id, user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto, @CurrentUser() user: any) {
        return this.propertiesService.update(id, updatePropertyDto, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.propertiesService.remove(id, user.id);
    }
}
