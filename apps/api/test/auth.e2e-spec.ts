import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
    let app: INestApplication;

    // TODO: E2E tests require a running database. Skipping until test database is configured.
    beforeAll(async () => {
        process.env.JWT_SECRET = 'test-secret-key';
        process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/mansil_test';
    });

    describe('POST /auth/register', () => {
        it.skip('should register a new user and return 201', async () => {
            const module: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            app = module.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();

            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: `test-${Date.now()}@mansil.com`,
                    password: 'password123',
                    name: '테스트유저',
                })
                .expect(201);

            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('email');
            expect(response.body.user).not.toHaveProperty('password');

            await app.close();
        });
    });

    describe('POST /auth/login', () => {
        it.skip('should login and return 200 with access_token', async () => {
            const module: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            app = module.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();

            // First register
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'login-test@mansil.com',
                    password: 'password123',
                    name: '로그인테스트',
                });

            // Then login
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'login-test@mansil.com',
                    password: 'password123',
                })
                .expect(200);

            expect(response.body).toHaveProperty('access_token');
            expect(response.body.user.email).toBe('login-test@mansil.com');

            await app.close();
        });

        it.skip('should return 401 for invalid credentials', async () => {
            const module: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            app = module.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();

            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'nonexistent@mansil.com',
                    password: 'wrongpassword',
                })
                .expect(401);

            await app.close();
        });
    });

    describe('Protected Routes', () => {
        it.skip('GET /properties without token should return 401', async () => {
            const module: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            app = module.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();

            await request(app.getHttpServer())
                .get('/properties')
                .expect(401);

            await app.close();
        });

        it.skip('GET /properties with valid token should return 200', async () => {
            const module: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            app = module.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();

            // Register and get token
            const registerResponse = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: `auth-test-${Date.now()}@mansil.com`,
                    password: 'password123',
                    name: '인증테스트',
                });

            const token = registerResponse.body.access_token;

            const response = await request(app.getHttpServer())
                .get('/properties')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');

            await app.close();
        });
    });
});
