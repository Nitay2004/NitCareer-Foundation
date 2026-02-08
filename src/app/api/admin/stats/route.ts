import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // In a real app, you'd check for an 'admin' role in Clerk metadata
        // For this demonstration, we'll proceed as if the requester is an admin

        const [expertsCount, studentsCount, bookingsCount, liveSessionsCount, recentBookings, experts] = await Promise.all([
            prisma.expert.count({ where: { isDeleted: false } }),
            prisma.user.count(),
            prisma.booking.count(),
            prisma.liveSession.count(),
            prisma.booking.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: { select: { firstName: true, lastName: true, email: true } },
                    expert: { select: { firstName: true, lastName: true } }
                }
            }),
            prisma.expert.findMany({
                where: { isDeleted: false },
                orderBy: { createdAt: 'desc' }
            })
        ])

        return NextResponse.json({
            stats: {
                experts: expertsCount,
                students: studentsCount,
                bookings: bookingsCount,
                sessions: liveSessionsCount,
                revenue: 0,
            },
            recentBookings,
            experts
        })

    } catch (error) {
        console.error("Admin stats fetch error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
