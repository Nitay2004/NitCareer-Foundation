
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const expertId = searchParams.get('expertId');

        const sessions = await prisma.liveSession.findMany({
            where: {
                ...(expertId ? { expertId } : {}),
                status: "upcoming",
                scheduledAt: {
                    gte: new Date()
                }
            },
            include: {
                expert: {
                    select: {
                        firstName: true,
                        lastName: true,
                        specialization: true,
                        profileImage: true,
                        rating: true
                    }
                },
                _count: {
                    select: { bookings: true }
                }
            },
            orderBy: {
                scheduledAt: 'asc'
            }
        });

        // Filter out sessions that are full
        const availableSessions = sessions.filter(s => s._count.bookings < s.maxStudents);

        return NextResponse.json({ sessions: availableSessions });
    } catch (error) {
        console.error("Fetch Sessions Error:", error);
        return NextResponse.json({ error: "Failed to fetch available sessions" }, { status: 500 });
    }
}
