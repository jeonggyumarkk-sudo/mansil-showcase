import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // ─── Users ───────────────────────────────────────────
    const agent = await prisma.user.upsert({
        where: { email: 'demo@mansil.com' },
        update: {},
        create: {
            email: 'demo@mansil.com',
            name: '이영교 중개사',
            password: hashedPassword,
            role: 'AGENT',
        },
    });

    const admin = await prisma.user.upsert({
        where: { email: 'admin@mansil.com' },
        update: {},
        create: {
            email: 'admin@mansil.com',
            name: '관리자',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log('Created users:', agent.id, admin.id);

    // ─── Properties ──────────────────────────────────────
    const propertyData = [
        {
            title: '아인스빌 309호',
            description: '채광 좋은 분리형 원룸입니다. 풀옵션이고 즉시 입주 가능합니다.',
            type: 'ONE_ROOM' as const,
            transactionType: 'MONTHLY' as const,
            status: 'AVAILABLE' as const,
            deposit: BigInt(20000000),
            monthlyRent: BigInt(350000),
            maintenanceFee: BigInt(50000),
            areaPyeong: 7,
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
            description: '신축급 리모델링 완료된 투룸. 역세권 도보 5분.',
            type: 'TWO_ROOM' as const,
            transactionType: 'MONTHLY' as const,
            status: 'AVAILABLE' as const,
            deposit: BigInt(30000000),
            monthlyRent: BigInt(450000),
            maintenanceFee: BigInt(70000),
            areaPyeong: 12,
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
        {
            title: '리치빌 504호',
            description: '조용한 주택가, 풀옵션. 전세 매물.',
            type: 'ONE_ROOM' as const,
            transactionType: 'JEONSE' as const,
            status: 'CONTRACT_PENDING' as const,
            deposit: BigInt(80000000),
            monthlyRent: BigInt(0),
            maintenanceFee: BigInt(100000),
            areaPyeong: 8,
            floor: 5,
            totalFloors: 5,
            roomCount: 1,
            bathroomCount: 1,
            address: '대전 유성구 장대동 111',
            roadAddress: '대전 유성구 장대로 55',
            lat: 36.361,
            lng: 127.352,
            agentId: agent.id,
        },
        {
            title: '한빛아파트 102동 1503호',
            description: '남향 3룸 아파트. 학군 우수, 대형마트 인접.',
            type: 'APARTMENT' as const,
            transactionType: 'SALE' as const,
            status: 'AVAILABLE' as const,
            deposit: BigInt(0),
            monthlyRent: BigInt(0),
            maintenanceFee: BigInt(150000),
            salePrice: BigInt(350000000),
            areaPyeong: 32,
            floor: 15,
            totalFloors: 25,
            roomCount: 3,
            bathroomCount: 2,
            address: '대전 유성구 봉명동 550',
            roadAddress: '대전 유성구 봉명로 88',
            lat: 36.358,
            lng: 127.349,
            agentId: agent.id,
        },
        {
            title: '궁동 상가 1층',
            description: '대학교 앞 유동인구 많은 상가. 즉시 영업 가능.',
            type: 'STORE' as const,
            transactionType: 'MONTHLY' as const,
            status: 'AVAILABLE' as const,
            deposit: BigInt(50000000),
            monthlyRent: BigInt(2000000),
            maintenanceFee: BigInt(200000),
            areaPyeong: 15,
            floor: 1,
            totalFloors: 5,
            roomCount: 1,
            bathroomCount: 1,
            address: '대전 유성구 궁동 300',
            roadAddress: '대전 유성구 대학로 200',
            lat: 36.364,
            lng: 127.356,
            agentId: agent.id,
        },
    ];

    const properties = [];
    for (const p of propertyData) {
        const property = await prisma.property.create({ data: p });
        properties.push(property);
        console.log(`Created property: ${property.title}`);
    }

    // ─── Property Images ─────────────────────────────────
    for (const prop of properties) {
        await prisma.propertyImage.create({
            data: {
                url: `/images/properties/${prop.id}/main.jpg`,
                propertyId: prop.id,
            },
        });
    }
    console.log('Created property images');

    // ─── Customers ───────────────────────────────────────
    const customerData = [
        {
            name: '김민수',
            phone: '010-1234-5678',
            email: 'minsu.kim@email.com',
            status: 'ACTIVE' as const,
            priority: 'HOT' as const,
            preferences: JSON.stringify({
                type: 'ONE_ROOM',
                maxDeposit: 30000000,
                maxRent: 400000,
                preferredArea: '궁동',
            }),
            notes: '충남대 대학원생. 3월 입주 희망.',
            nextFollowupDate: new Date('2026-03-01'),
            agentId: agent.id,
        },
        {
            name: '박지영',
            phone: '010-2345-6789',
            email: 'jiyoung.park@email.com',
            status: 'ACTIVE' as const,
            priority: 'WARM' as const,
            preferences: JSON.stringify({
                type: 'TWO_ROOM',
                maxDeposit: 50000000,
                maxRent: 600000,
                preferredArea: '봉명동',
            }),
            notes: '신혼부부. 주차 필수.',
            nextFollowupDate: new Date('2026-03-05'),
            agentId: agent.id,
        },
        {
            name: '이준혁',
            phone: '010-3456-7890',
            status: 'CONTRACTED' as const,
            priority: 'COLD' as const,
            notes: '계약 완료. 아인스빌 309호 입주.',
            agentId: agent.id,
        },
        {
            name: '최수진',
            phone: '010-4567-8901',
            email: 'sujin.choi@email.com',
            status: 'ACTIVE' as const,
            priority: 'HOT' as const,
            preferences: JSON.stringify({
                type: 'APARTMENT',
                budget: 400000000,
                preferredArea: '봉명동',
            }),
            notes: '매매 관심 고객. 한빛아파트 관심.',
            nextFollowupDate: new Date('2026-02-28'),
            agentId: agent.id,
        },
        {
            name: '정태현',
            phone: '010-5678-9012',
            status: 'INACTIVE' as const,
            priority: 'COLD' as const,
            notes: '연락 두절. 다음 시즌 재연락 예정.',
            agentId: agent.id,
        },
    ];

    const customers = [];
    for (const c of customerData) {
        const customer = await prisma.customer.create({ data: c });
        customers.push(customer);
        console.log(`Created customer: ${customer.name}`);
    }

    // ─── Contracts ───────────────────────────────────────
    const contractData = [
        {
            propertyId: properties[0].id,
            customerId: customers[2].id,
            agentId: agent.id,
            type: 'RENT' as const,
            status: 'ACTIVE' as const,
            deposit: BigInt(20000000),
            monthlyRent: BigInt(350000),
            commission: BigInt(175000),
            startDate: new Date('2026-01-15'),
            endDate: new Date('2028-01-14'),
            moveInDate: new Date('2026-02-01'),
            note: '2년 계약. 풀옵션 확인 완료.',
        },
        {
            propertyId: properties[2].id,
            customerId: customers[0].id,
            agentId: agent.id,
            type: 'JEONSE' as const,
            status: 'DRAFT' as const,
            deposit: BigInt(80000000),
            commission: BigInt(400000),
            note: '전세 계약 협의 중.',
        },
    ];

    const contracts = [];
    for (const ct of contractData) {
        const contract = await prisma.contract.create({ data: ct });
        contracts.push(contract);
        console.log(`Created contract: ${contract.id}`);
    }

    // ─── Ledger Transactions ─────────────────────────────
    const ledgerData = [
        {
            type: 'INCOME' as const,
            amount: BigInt(175000),
            category: 'COMMISSION',
            date: new Date('2026-01-15'),
            description: '아인스빌 309호 중개수수료',
            contractId: contracts[0].id,
            agentId: agent.id,
        },
        {
            type: 'EXPENSE' as const,
            amount: BigInt(50000),
            category: 'OFFICE',
            date: new Date('2026-01-20'),
            description: '사무실 소모품 구입',
            agentId: agent.id,
        },
        {
            type: 'EXPENSE' as const,
            amount: BigInt(30000),
            category: 'TRANSPORT',
            date: new Date('2026-02-01'),
            description: '매물 방문 교통비',
            agentId: agent.id,
        },
        {
            type: 'INCOME' as const,
            amount: BigInt(350000),
            category: 'RENT',
            date: new Date('2026-02-01'),
            description: '아인스빌 309호 2월 임대료 수금',
            contractId: contracts[0].id,
            agentId: agent.id,
        },
    ];

    for (const l of ledgerData) {
        await prisma.ledgerTransaction.create({ data: l });
    }
    console.log('Created ledger transactions');

    // ─── Client Requests ─────────────────────────────────
    const requestData = [
        {
            status: 'PENDING',
            clientName: '홍길동',
            clientPhone: '010-9876-5432',
            minDeposit: 10000000,
            maxDeposit: 30000000,
            minRent: 200000,
            maxRent: 400000,
            preferredLocations: '궁동,장대동',
            preferredTypes: 'ONE_ROOM,TWO_ROOM',
            agentId: agent.id,
        },
        {
            status: 'MATCHED',
            clientName: '강예린',
            clientPhone: '010-1111-2222',
            minDeposit: 50000000,
            maxDeposit: 100000000,
            preferredLocations: '봉명동',
            preferredTypes: 'APARTMENT',
            agentId: agent.id,
        },
    ];

    for (const r of requestData) {
        await prisma.clientRequest.create({ data: r });
    }
    console.log('Created client requests');

    // ─── Real Transactions ───────────────────────────────
    const realTxData = [
        {
            address: '대전 유성구 궁동 486',
            price: BigInt(22000000),
            date: new Date('2025-12-15'),
            area: 7.5,
            floor: 3,
            type: 'MONTHLY',
            lat: 36.363,
            lng: 127.355,
        },
        {
            address: '대전 유성구 봉명동 550',
            price: BigInt(320000000),
            date: new Date('2025-11-20'),
            area: 32,
            floor: 10,
            type: 'SALE',
            lat: 36.358,
            lng: 127.349,
        },
        {
            address: '대전 유성구 장대동 111',
            price: BigInt(75000000),
            date: new Date('2025-10-05'),
            area: 8,
            floor: 4,
            type: 'JEONSE',
            lat: 36.361,
            lng: 127.352,
        },
    ];

    for (const rt of realTxData) {
        await prisma.realTransaction.create({ data: rt });
    }
    console.log('Created real transactions');

    // ─── Posts & Comments ─────────────────────────────────
    const post1 = await prisma.post.create({
        data: {
            title: '궁동 원룸 시세 문의드립니다',
            content: '충남대 근처 원룸 보증금/월세 시세가 어떻게 되나요? 내년 3월 입주 예정입니다.',
            category: 'QNA',
            authorId: agent.id,
        },
    });

    const post2 = await prisma.post.create({
        data: {
            title: '내놔요: 봉명동 아파트 매매',
            content: '봉명동 한빛아파트 32평 매매 내놓습니다. 남향, 풀옵션. 희망가 3.5억.',
            category: 'NAENWAYO',
            authorId: agent.id,
        },
    });

    const post3 = await prisma.post.create({
        data: {
            title: '2026년 중개수수료 요율 변경 안내',
            content: '2026년 1월부터 변경된 중개수수료 요율표를 안내드립니다.',
            category: 'NOTICE',
            authorId: admin.id,
        },
    });

    await prisma.comment.create({
        data: {
            content: '궁동 원룸 보증금 2천~3천, 월세 30~45만원 정도입니다.',
            postId: post1.id,
            authorId: agent.id,
        },
    });

    await prisma.comment.create({
        data: {
            content: '감사합니다! 연락드려도 될까요?',
            postId: post1.id,
            authorId: admin.id,
        },
    });

    console.log('Created posts and comments');
    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
