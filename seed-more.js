
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seed() {
    try {
        console.log('Seeding experts...')
        const experts = [
            {
                clerkId: 'expert_2',
                email: 'rajesh@example.com',
                firstName: 'Rajesh',
                lastName: 'Kumar',
                specialization: ['Software Development', 'Interview Prep'],
                experience: 8,
                rating: 4.9,
                isActive: true,
                bio: 'Senior software engineer at top tech company.'
            },
            {
                clerkId: 'expert_3',
                email: 'meera@example.com',
                firstName: 'Meera',
                lastName: 'Patel',
                specialization: ['Research', 'PhD Guidance'],
                experience: 15,
                rating: 4.7,
                isActive: true,
                bio: 'Research director with extensive experience.'
            }
        ]

        for (const expert of experts) {
            await prisma.expert.upsert({
                where: { clerkId: expert.clerkId },
                update: {},
                create: expert
            })
        }
        console.log('Experts seeded.')
    } catch (err) {
        console.error(err)
    } finally {
        await prisma.$disconnect()
    }
}

seed()
