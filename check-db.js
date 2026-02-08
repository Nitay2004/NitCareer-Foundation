
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkData() {
    try {
        console.log('Sending query...')
        const expertCount = await prisma.expert.count()
        console.log(`Experts: ${expertCount}`)
    } catch (err) {
        console.error('Runtime error:', err)
    } finally {
        await prisma.$disconnect()
    }
}

checkData()
