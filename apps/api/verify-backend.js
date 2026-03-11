const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'test@example.com',
                password: 'hashedpassword',
                name: 'Test User',
                role: 'AGENT'
            }
        });
        console.log('Created User:', user.id);
    } else {
        console.log('Found User:', user.id);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
