import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PropertiesModule } from './modules/properties/properties.module';
import { AuthModule } from './modules/auth/auth.module';
import { RequestsModule } from './modules/requests/requests.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { RealTransactionModule } from './real-transaction/real-transaction.module';
import { CommunityModule } from './modules/community/community.module';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Global config from .env (OPS-009, OPS-010)
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting (SEC-006)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),

    // Singleton Prisma (API-019)
    DatabaseModule,

    // Health check (OPS-015)
    HealthModule,

    // Feature modules
    PropertiesModule,
    AuthModule,
    RequestsModule,
    CustomersModule,
    ContractsModule,
    LedgerModule,
    ScheduleModule,
    RealTransactionModule,
    CommunityModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    // Global throttler guard (SEC-006)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
