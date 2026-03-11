import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RealTransactionService } from './real-transaction.service';
import { JwtAuthGuard } from '../modules/auth/auth.guard';

@Controller('real-transactions')
@UseGuards(JwtAuthGuard)
export class RealTransactionController {
    constructor(private readonly service: RealTransactionService) { }

    @Get()
    async getTransactions(
        @Query('north') north: string,
        @Query('south') south: string,
        @Query('east') east: string,
        @Query('west') west: string,
    ) {
        return this.service.getTransactions({
            north: parseFloat(north),
            south: parseFloat(south),
            east: parseFloat(east),
            west: parseFloat(west),
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }
}
