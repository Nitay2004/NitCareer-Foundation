import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params;

        const expert = await prisma.expert.findUnique({
            where: { id }
        })

        if (!expert) {
            return NextResponse.json({ error: "Expert not found" }, { status: 404 })
        }

        const [bookings, liveSessions] = await Promise.all([
            prisma.booking.findMany({
                where: { expertId: id },
                include: {
                    student: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { scheduledAt: "desc" }
            }),
            prisma.liveSession.findMany({
                where: { expertId: id },
                include: {
                    _count: {
                        select: { bookings: true }
                    }
                },
                orderBy: { scheduledAt: "desc" }
            })
        ]);

        return NextResponse.json({ bookings, liveSessions, expert })
    } catch (error) {
        console.error("Admin Expert View Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
