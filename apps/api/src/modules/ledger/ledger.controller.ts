import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CreateLedgerDto } from './dto/create-ledger.dto';
import { UpdateLedgerDto } from './dto/update-ledger.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
    constructor(private readonly ledgerService: LedgerService) { }

    @Post()
    create(@Body() createLedgerDto: CreateLedgerDto, @CurrentUser() user: any) {
        return this.ledgerService.create(createLedgerDto, user.id);
    }

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @CurrentUser() user: any,
    ) {
        return this.ledgerService.findAll(user.id, Number(page) || 1, Math.min(Number(limit) || 20, 100));
    }

    @Get('stats')
    getStats(
        @Query('year') year: string,
        @Query('month') month: string,
        @CurrentUser() user: any,
    ) {
        return this.ledgerService.getMonthlyStats(user.id, Number(year), Number(month));
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.ledgerService.findOne(id, user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateLedgerDto: UpdateLedgerDto, @CurrentUser() user: any) {
        return this.ledgerService.update(id, updateLedgerDto, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.ledgerService.remove(id, user.id);
    }
}
