import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { PropertyType, TransactionType } from '@mansil/types';

const propertyTypes = Object.values(PropertyType);
const transactionTypes = Object.values(TransactionType);

export class CreatePropertyDto {
    @IsString()
    title!: string;

    @IsString()
    description!: string;

    @IsIn(propertyTypes)
    type!: string;

    @IsIn(transactionTypes)
    transactionType!: string;

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
    areaPyeong!: number;

    @IsNumber()
    floor!: number;

    @IsNumber()
    totalFloors!: number;

    @IsNumber()
    roomCount!: number;

    @IsNumber()
    bathroomCount!: number;

    @IsString()
    address!: string;

    @IsString()
    @IsOptional()
    roadAddress?: string;

    @IsString()
    @IsOptional()
    detailAddress?: string;

    @IsNumber()
    lat!: number;

    @IsNumber()
    lng!: number;
}
