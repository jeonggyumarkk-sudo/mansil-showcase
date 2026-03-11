import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    create(@Body() createCustomerDto: CreateCustomerDto, @CurrentUser() user: any) {
        return this.customersService.create(createCustomerDto, user.id);
    }

    @Get()
    findAll(
        @Query('status') status: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @CurrentUser() user: any,
    ) {
        return this.customersService.findAll(user.id, status, Number(page) || 1, Math.min(Number(limit) || 20, 100));
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.customersService.findOne(id, user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto, @CurrentUser() user: any) {
        return this.customersService.update(id, updateCustomerDto, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.customersService.remove(id, user.id);
    }
}
