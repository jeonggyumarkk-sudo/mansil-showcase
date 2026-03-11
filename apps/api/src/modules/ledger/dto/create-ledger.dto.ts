import { IsString, IsNumber, IsOptional, IsDateString, IsIn } from 'class-validator';
import { LedgerType } from '@mansil/types';

const ledgerTypes = Object.values(LedgerType);

export class CreateLedgerDto {
    @IsIn(ledgerTypes)
    type!: string;

    @IsNumber()
    amount!: number;

    @IsString()
    category!: string;

    @IsDateString()
    date!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    contractId?: string;
}
