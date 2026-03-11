const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst().then(u => {
    if (u) console.log(u.id);
    else console.log('NO_USER');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
