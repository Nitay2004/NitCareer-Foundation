require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
        console.log('Attempting to connect to database...');
        const result = await prisma.$queryRaw`SELECT 1`;
        console.log('Connection successful:', result);
    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
