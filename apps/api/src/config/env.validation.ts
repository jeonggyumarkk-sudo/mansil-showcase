import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

export function validateEnvironment() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    logger.error('JWT_SECRET environment variable is not set');
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (jwtSecret === 'mansil-secret-key-change-in-prod') {
    logger.warn(
      'JWT_SECRET is set to the default development value. Use a strong, unique secret in production.',
    );
  }
}
