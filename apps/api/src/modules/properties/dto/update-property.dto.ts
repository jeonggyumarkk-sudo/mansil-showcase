import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { PropertyType, TransactionType, PropertyStatus } from '@mansil/types';

const propertyTypes = Object.values(PropertyType);
const transactionTypes = Object.values(TransactionType);
const propertyStatuses = Object.values(PropertyStatus);

export class UpdatePropertyDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsIn(propertyTypes)
    @IsOptional()
    type?: string;

    @IsIn(transactionTypes)
    @IsOptional()
    transactionType?: string;

    @IsIn(propertyStatuses)
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
    maintenanceFee?: number;

    @IsNumber()
    @IsOptional()
    salePrice?: number;

    @IsNumber()
    @IsOptional()
    areaPyeong?: number;

    @IsNumber()
    @IsOptional()
    floor?: number;

    @IsNumber()
    @IsOptional()
    totalFloors?: number;

    @IsNumber()
    @IsOptional()
    roomCount?: number;

    @IsNumber()
    @IsOptional()
    bathroomCount?: number;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    roadAddress?: string;

    @IsNumber()
    @IsOptional()
    lat?: number;

    @IsNumber()
    @IsOptional()
    lng?: number;
}
