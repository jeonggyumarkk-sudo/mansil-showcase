import { IsString, IsOptional, IsNumber, IsIn, IsDateString } from 'class-validator';
import { ContractType } from '@mansil/types';

const contractTypes = Object.values(ContractType);

export class CreateContractDto {
    @IsString()
    propertyId!: string;

    @IsString()
    customerId!: string;

    @IsIn(contractTypes)
    type!: string;

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
    contractDate?: string;

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
