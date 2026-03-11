import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Post()
    create(@Body() createContractDto: CreateContractDto, @CurrentUser() user: any) {
        return this.contractsService.create(createContractDto, user.id);
    }

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @CurrentUser() user: any,
    ) {
        return this.contractsService.findAll(user.id, Number(page) || 1, Math.min(Number(limit) || 20, 100));
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.contractsService.findOne(id, user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateContractDto: UpdateContractDto, @CurrentUser() user: any) {
        return this.contractsService.update(id, updateContractDto, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.contractsService.remove(id, user.id);
    }
}
