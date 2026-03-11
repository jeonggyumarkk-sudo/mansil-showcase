const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    try {
        // Create demo agent
        const agent = await prisma.user.upsert({
            where: { email: 'demo@mansil.com' },
            update: {},
            create: {
                email: 'demo@mansil.com',
                name: '이영교 중개사',
                password: 'password123',
                role: 'AGENT',
            },
        });

        console.log('Created agent:', agent.id);

        // Clean up existing properties
        await prisma.property.deleteMany({ where: { agentId: agent.id } });
        console.log('Cleared existing properties for agent');

        // Create dummy properties
        const propertyData = [
            {
                title: '아인스빌 309호',
                description: '채광 좋은 분리형 원룸입니다. 풀옵션이고 즉시 입주 가능합니다.',
                type: 'ONE_ROOM',
                transactionType: 'MONTHLY',
                status: 'AVAILABLE',
                deposit: 20000000,
                monthlyRent: 350000,
                maintenanceFee: 50000,
                area: 7,
                floor: 3,
                totalFloors: 4,
                roomCount: 1,
                bathroomCount: 1,
                address: '대전 유성구 궁동 486-4',
                roadAddress: '대전 유성구 대학로76번안길 31',
                lat: 36.363,
                lng: 127.355,
                agentId: agent.id,
            },
            {
                title: '오이코스 2층',
                description: '신축급 리모델링 완료된 투룸',
                type: 'TWO_ROOM',
                transactionType: 'MONTHLY',
                status: 'AVAILABLE',
                deposit: 30000000,
                monthlyRent: 450000,
                maintenanceFee: 70000,
                area: 12,
                floor: 2,
                totalFloors: 4,
                roomCount: 2,
                bathroomCount: 1,
                address: '대전 유성구 궁동 412-1',
                roadAddress: '대전 유성구 대학로 123',
                lat: 36.365,
                lng: 127.358,
                agentId: agent.id,
            },
        ];

        for (const p of propertyData) {
            const property = await prisma.property.create({
                data: p,
            });
            console.log(`Created property with id: ${property.id}`);
        }

        console.log('Seeding finished.');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
