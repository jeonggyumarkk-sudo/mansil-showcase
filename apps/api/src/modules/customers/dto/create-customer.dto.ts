import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';
import { CustomerStatus, CustomerPriority } from '@mansil/types';

const customerStatuses = Object.values(CustomerStatus);
const customerPriorities = Object.values(CustomerPriority);

export class CreateCustomerDto {
    @IsString()
    name!: string;

    @IsString()
    phone!: string;

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
