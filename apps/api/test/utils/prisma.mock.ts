export const createMockPrismaService = () => {
    const mockModels = [
        'user',
        'property',
        'contract',
        'customer',
        'clientRequest',
        'ledgerTransaction',
        'post',
        'comment',
        'realTransaction',
        'propertyImage',
        'auditLog',
    ];

    const mockPrisma: any = {};
    for (const model of mockModels) {
        mockPrisma[model] = {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
            count: jest.fn(),
        };
    }
    mockPrisma.$queryRaw = jest.fn();
    mockPrisma.$connect = jest.fn();
    mockPrisma.$disconnect = jest.fn();
    mockPrisma.onModuleInit = jest.fn();
    mockPrisma.onModuleDestroy = jest.fn();

    return mockPrisma;
};
