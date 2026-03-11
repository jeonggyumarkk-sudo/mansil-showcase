import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting debug...');
        const north = 37.0;
        const south = 36.0;
        const east = 128.0;
        const west = 127.0;
        const zoom = 10;
        const gridSize = 0.5; // (0.5 / Math.pow(2, 0))

        console.log('Testing simple select...');
        const simple = await prisma.$queryRaw`SELECT 1 as num`;
        console.log('Simple select result:', simple);

        console.log('Testing clustering query with Unsafe...');

        const query = `
            SELECT 
                CAST(count(*) AS INTEGER) as count, 
                avg(lat) as lat, 
                avg(lng) as lng,
                min(deposit) as minPrice
            FROM Property 
            WHERE lat <= ${north} AND lat >= ${south} 
              AND lng <= ${east} AND lng >= ${west}
              AND status = 'AVAILABLE'
            GROUP BY cast(lat / ${gridSize} as int), cast(lng / ${gridSize} as int)
        `;

        console.log('Query String:', query);

        const result = await prisma.$queryRawUnsafe(query);

        console.log('Clustering result:', JSON.stringify(result, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));

    } catch (e) {
        console.error('Debug Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
