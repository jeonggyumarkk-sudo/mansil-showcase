import { Module } from '@nestjs/common';
import { RealTransactionService } from './real-transaction.service';
import { RealTransactionController } from './real-transaction.controller';

@Module({
    controllers: [RealTransactionController],
    providers: [RealTransactionService],
})
export class RealTransactionModule { }
