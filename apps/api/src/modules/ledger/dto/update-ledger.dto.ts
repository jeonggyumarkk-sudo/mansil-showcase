import { IsString, IsNumber, IsOptional, IsDateString, IsIn } from 'class-validator';
import { LedgerType } from '@mansil/types';

const ledgerTypes = Object.values(LedgerType);

export class UpdateLedgerDto {
    @IsIn(ledgerTypes)
    @IsOptional()
    type?: string;

    @IsNumber()
    @IsOptional()
    amount?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    contractId?: string;
}
