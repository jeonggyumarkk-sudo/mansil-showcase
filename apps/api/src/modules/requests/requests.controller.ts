import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    @Post()
    create(@Body() createRequestDto: CreateRequestDto, @CurrentUser() user: any) {
        return this.requestsService.create(createRequestDto, user.id);
    }

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @CurrentUser() user: any,
    ) {
        return this.requestsService.findAll(user.id, Number(page) || 1, Math.min(Number(limit) || 20, 100));
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.requestsService.findOne(id, user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRequestDto: UpdateRequestDto, @CurrentUser() user: any) {
        return this.requestsService.update(id, updateRequestDto, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.requestsService.remove(id, user.id);
    }

    @Get(':id/matches')
    findMatches(@Param('id') id: string, @CurrentUser() user: any) {
        return this.requestsService.findMatches(id, user.id);
    }
}
