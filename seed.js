
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seed() {
    try {
        console.log('Seeding...')
        // Try to find any expert
        const experts = await prisma.expert.findMany()
        console.log('Experts found:', experts.length)

        if (experts.length === 0) {
            console.log('No experts found. Creating one...')
            await prisma.expert.create({
                data: {
                    clerkId: 'mock-expert-1',
                    email: 'priya@example.com',
                    firstName: 'Priya',
                    lastName: 'Sharma',
                    specialization: ['Engineering', 'Technology'],
                    experience: 12,
                    rating: 4.8,
                    isActive: true
                }
            })
            console.log('Expert created.')
        }
    } catch (err) {
        console.error('Seed error:', err)
    } finally {
        await prisma.$disconnect()
    }
}

seed()
