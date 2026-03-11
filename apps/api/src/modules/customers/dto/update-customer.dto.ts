import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';
import { CustomerStatus, CustomerPriority } from '@mansil/types';

const customerStatuses = Object.values(CustomerStatus);
const customerPriorities = Object.values(CustomerPriority);

export class UpdateCustomerDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsIn(customerStatuses)
    @IsOptional()
    status?: string;

    @IsIn(customerPriorities)
    @IsOptional()
    priority?: string;

    @IsString()
    @IsOptional()
    preferences?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsDateString()
    @IsOptional()
    nextFollowupDate?: string;
}
