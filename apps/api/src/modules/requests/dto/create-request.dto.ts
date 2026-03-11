import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateRequestDto {
    @IsString()
    clientName!: string;

    @IsString()
    clientPhone!: string;

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
