import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { validateEnvironment } from './config/env.validation';

// BigInt JSON serialization — use string to avoid precision loss (SEC-019)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  validateEnvironment();

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security headers (SEC-008)
  app.use(helmet());

  // CORS from environment (SEC-004)
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe (API-034)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter (API-017)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Graceful shutdown (OPS-023)
  app.enableShutdownHooks();

  // Port from env (OPS-022)
  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
bootstrap();
