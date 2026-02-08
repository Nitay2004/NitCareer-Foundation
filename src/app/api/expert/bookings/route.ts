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

        // Find the expert record associated with this clerkId
        const expert = await prisma.expert.findUnique({
            where: { clerkId: userId }
        })

        if (!expert) {
            return NextResponse.json({ error: "Not an expert" }, { status: 403 })
        }

        const bookings = await prisma.booking.findMany({
            where: {
                expertId: expert.id
            },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: {
                scheduledAt: "desc"
            }
        })

        const liveSessions = await prisma.liveSession.findMany({
            where: { expertId: expert.id },
            include: {
                _count: {
                    select: { bookings: true }
                }
            },
            orderBy: { scheduledAt: "desc" }
        })

        return NextResponse.json({ bookings, liveSessions, expert })

    } catch (error) {
        console.error("Error fetching expert bookings:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
