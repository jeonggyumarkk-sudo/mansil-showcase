import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
    let app: INestApplication;

    // TODO: E2E tests require a running database. Skipping until test database is configured.
    beforeAll(async () => {
        // Set test environment variables
        process.env.JWT_SECRET = 'test-secret-key';
        process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/mansil_test';
    });

    describe('Health Check', () => {
        it.skip('GET /health should return 200 with status ok', async () => {
            const module: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            app = module.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();

            const response = await request(app.getHttpServer())
                .get('/health')
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    status: 'ok',
                }),
            );

            await app.close();
        });
    });

    describe('App Bootstrap', () => {
        it.skip('should bootstrap without errors', async () => {
            const module: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            app = module.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

            await expect(app.init()).resolves.not.toThrow();

            await app.close();
        });
    });
});
