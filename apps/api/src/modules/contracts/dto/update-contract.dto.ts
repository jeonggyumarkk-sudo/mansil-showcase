import { IsString, IsOptional, IsNumber, IsIn, IsDateString } from 'class-validator';
import { ContractType, ContractStatus } from '@mansil/types';

const contractTypes = Object.values(ContractType);
const contractStatuses = Object.values(ContractStatus);

export class UpdateContractDto {
    @IsIn(contractTypes)
    @IsOptional()
    type?: string;

    @IsIn(contractStatuses)
    @IsOptional()
    status?: string;

    @IsNumber()
    @IsOptional()
    deposit?: number;

    @IsNumber()
    @IsOptional()
    monthlyRent?: number;

    @IsNumber()
    @IsOptional()
    salePrice?: number;

    @IsNumber()
    @IsOptional()
    commission?: number;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsDateString()
    @IsOptional()
    moveInDate?: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    pdfUrl?: string;
}
