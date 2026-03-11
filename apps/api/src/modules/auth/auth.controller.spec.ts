import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: any;

    beforeEach(async () => {
        authService = {
            validateUser: jest.fn(),
            login: jest.fn(),
            register: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: authService }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    describe('login', () => {
        it('should return login result for valid credentials', async () => {
            const user = { id: 'user-1', email: 'test@mansil.com', name: '테스트', role: 'AGENT' };
            const loginResult = { access_token: 'token', user };

            authService.validateUser.mockResolvedValue(user);
            authService.login.mockResolvedValue(loginResult);

            const result = await controller.login({ email: 'test@mansil.com', password: 'password123' });

            expect(authService.validateUser).toHaveBeenCalledWith('test@mansil.com', 'password123');
            expect(authService.login).toHaveBeenCalledWith(user);
            expect(result).toEqual(loginResult);
        });

        it('should throw UnauthorizedException for invalid credentials', async () => {
            authService.validateUser.mockResolvedValue(null);

            await expect(
                controller.login({ email: 'test@mansil.com', password: 'wrong' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should not call login when validation fails', async () => {
            authService.validateUser.mockResolvedValue(null);

            try {
                await controller.login({ email: 'test@mansil.com', password: 'wrong' });
            } catch {
                // expected
            }

            expect(authService.login).not.toHaveBeenCalled();
        });
    });

    describe('register', () => {
        const mockReq = { ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' } } as any;

        const mockConsents = [
            { type: 'privacy_policy', version: '1.0', accepted: true },
            { type: 'terms_of_service', version: '1.0', accepted: true },
        ];

        it('should return registration result', async () => {
            const registerResult = {
                access_token: 'new-token',
                user: { id: 'user-2', email: 'new@mansil.com', name: '새유저', role: 'AGENT' },
            };
            authService.register.mockResolvedValue(registerResult);

            const result = await controller.register({
                email: 'new@mansil.com',
                password: 'password123',
                name: '새유저',
                consents: mockConsents,
            }, mockReq);

            expect(authService.register).toHaveBeenCalledWith({
                email: 'new@mansil.com',
                password: 'password123',
                name: '새유저',
                consents: mockConsents,
            }, '127.0.0.1');
            expect(result).toEqual(registerResult);
        });

        it('should propagate ConflictException from service', async () => {
            const { ConflictException } = require('@nestjs/common');
            authService.register.mockRejectedValue(new ConflictException('이미 등록된 이메일입니다'));

            await expect(
                controller.register({
                    email: 'existing@mansil.com',
                    password: 'password123',
                    name: '중복',
                    consents: mockConsents,
                }, mockReq),
            ).rejects.toThrow(ConflictException);
        });
    });
});
