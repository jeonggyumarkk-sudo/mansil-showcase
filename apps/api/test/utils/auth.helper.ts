import { JwtService } from '@nestjs/jwt';

export const createTestToken = (
    userId: number,
    email: string = 'test@test.com',
): string => {
    const jwt = new JwtService({ secret: 'test-secret' });
    return jwt.sign({ sub: userId, email });
};

export const testUser = {
    id: 1,
    email: 'test@mansil.com',
    name: '테스트 에이전트',
    password: '$2b$10$hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
};
