import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let prisma: any;
    let jwtService: any;

    const mockUser = {
        id: 'user-1',
        email: 'test@mansil.com',
        name: '테스트',
        role: 'AGENT',
        password: '$2b$10$hashedpassword',
    };

    beforeEach(async () => {
        prisma = {
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
            },
            consentRecord: {
                createMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
            $transaction: jest.fn((cb) => cb(prisma)),
        };

        jwtService = {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prisma },
                { provide: JwtService, useValue: jwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe('validateUser', () => {
        it('should return user without password for valid credentials', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.validateUser('test@mansil.com', 'password123');

            expect(result).toEqual({
                id: 'user-1',
                email: 'test@mansil.com',
                name: '테스트',
                role: 'AGENT',
            });
            expect(result).not.toHaveProperty('password');
        });

        it('should return null for invalid password', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await service.validateUser('test@mansil.com', 'wrongpassword');

            expect(result).toBeNull();
        });

        it('should return null for non-existent user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await service.validateUser('nonexistent@mansil.com', 'password123');

            expect(result).toBeNull();
        });

        it('should query user by email with correct select fields', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await service.validateUser('test@mansil.com', 'password');

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@mansil.com' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    password: true,
                },
            });
        });
    });

    describe('login', () => {
        it('should return access_token with correct payload', async () => {
            const user = { id: 'user-1', email: 'test@mansil.com', name: '테스트', role: 'AGENT' };

            const result = await service.login(user);

            expect(jwtService.sign).toHaveBeenCalledWith({
                email: 'test@mansil.com',
                sub: 'user-1',
                role: 'AGENT',
            });
            expect(result).toEqual({
                access_token: 'mock-jwt-token',
                user: {
                    id: 'user-1',
                    email: 'test@mansil.com',
                    name: '테스트',
                    role: 'AGENT',
                },
            });
        });

        it('should include user info in response', async () => {
            const user = { id: 'user-2', email: 'agent@mansil.com', name: null, role: 'AGENT' };

            const result = await service.login(user);

            expect(result.user).toEqual({
                id: 'user-2',
                email: 'agent@mansil.com',
                name: null,
                role: 'AGENT',
            });
        });
    });

    describe('register', () => {
        const mockConsents = [
            { type: 'privacy_policy' as const, version: '1.0', accepted: true },
            { type: 'terms_of_service' as const, version: '1.0', accepted: true },
        ];

        it('should create user with hashed password', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            prisma.user.create.mockResolvedValue({
                id: 'new-user',
                email: 'new@mansil.com',
                name: '새로운유저',
                role: 'AGENT',
                password: 'hashed-password',
            });

            await service.register({
                email: 'new@mansil.com',
                password: 'password123',
                name: '새로운유저',
                consents: mockConsents,
            });

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    email: 'new@mansil.com',
                    password: 'hashed-password',
                    name: '새로운유저',
                    role: 'AGENT',
                },
            });
        });

        it('should persist consent records in transaction', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            prisma.user.create.mockResolvedValue({
                id: 'new-user',
                email: 'new@mansil.com',
                name: '새로운유저',
                role: 'AGENT',
                password: 'hashed-password',
            });

            await service.register({
                email: 'new@mansil.com',
                password: 'password123',
                name: '새로운유저',
                consents: mockConsents,
            }, '192.168.1.1');

            expect(prisma.consentRecord.createMany).toHaveBeenCalledWith({
                data: [
                    { userId: 'new-user', type: 'privacy_policy', version: '1.0', accepted: true, ipAddress: '192.168.1.1' },
                    { userId: 'new-user', type: 'terms_of_service', version: '1.0', accepted: true, ipAddress: '192.168.1.1' },
                ],
            });
        });

        it('should exclude password from response and return login result', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            prisma.user.create.mockResolvedValue({
                id: 'new-user',
                email: 'new@mansil.com',
                name: '새로운유저',
                role: 'AGENT',
                password: 'hashed-password',
            });

            const result = await service.register({
                email: 'new@mansil.com',
                password: 'password123',
                name: '새로운유저',
                consents: mockConsents,
            });

            expect(result).toEqual({
                access_token: 'mock-jwt-token',
                user: {
                    id: 'new-user',
                    email: 'new@mansil.com',
                    name: '새로운유저',
                    role: 'AGENT',
                },
            });
        });

        it('should throw ConflictException for duplicate email', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            const prismaError = new Error('Unique constraint failed') as any;
            prismaError.code = 'P2002';
            prisma.user.create.mockRejectedValue(prismaError);

            await expect(
                service.register({
                    email: 'existing@mansil.com',
                    password: 'password123',
                    name: '중복유저',
                    consents: mockConsents,
                }),
            ).rejects.toThrow(ConflictException);
        });

        it('should re-throw non-P2002 errors', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            prisma.user.create.mockRejectedValue(new Error('Database connection error'));

            await expect(
                service.register({
                    email: 'new@mansil.com',
                    password: 'password123',
                    name: '새유저',
                    consents: mockConsents,
                }),
            ).rejects.toThrow('Database connection error');
        });
    });
});
