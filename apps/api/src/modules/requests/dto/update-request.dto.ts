import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { RequestStatus } from '@mansil/types';

const requestStatuses = Object.values(RequestStatus);

export class UpdateRequestDto {
    @IsIn(requestStatuses)
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    clientName?: string;

    @IsString()
    @IsOptional()
    clientPhone?: string;

    @IsNumber()
    @IsOptional()
    minDeposit?: number;

    @IsNumber()
    @IsOptional()
    maxDeposit?: number;

    @IsNumber()
    @IsOptional()
    minRent?: number;

    @IsNumber()
    @IsOptional()
    maxRent?: number;

    @IsString()
    @IsOptional()
    preferredLocations?: string;

    @IsString()
    @IsOptional()
    preferredTypes?: string;
}
