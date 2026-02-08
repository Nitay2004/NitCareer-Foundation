
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        // Here we should check if user is admin. For now assuming admin access if they reach here or check metadata
        // In a real app: if (user.publicMetadata.role !== 'admin') ...

        const sessions = await prisma.liveSession.findMany({
            include: {
                expert: {
                    select: {
                        firstName: true,
                        lastName: true,
                        profileImage: true
                    }
                },
                _count: {
                    select: { bookings: true }
                }
            },
            orderBy: {
                scheduledAt: 'desc'
            }
        });

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error("Admin Sessions Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch all sessions" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { expertId, title, description, sessionType, scheduledAt, duration, maxStudents } = body;

        if (!expertId || !title || !scheduledAt) {
            return NextResponse.json({ error: "Expert ID, Title and Date are required" }, { status: 400 });
        }

        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
            return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }

        if (scheduledDate < new Date()) {
            return NextResponse.json({ error: "Cannot schedule sessions in the past" }, { status: 400 });
        }

        const dur = parseInt(duration) || 60;
        if (dur <= 0) {
            return NextResponse.json({ error: "Duration must be a positive number" }, { status: 400 });
        }

        const maxS = parseInt(maxStudents) || 50;
        if (maxS <= 0) {
            return NextResponse.json({ error: "Maximum students must be at least 1" }, { status: 400 });
        }

        const session = await prisma.liveSession.create({
            data: {
                expertId,
                title,
                description,
                sessionType: sessionType || "group_counselling",
                scheduledAt: scheduledDate,
                duration: dur,
                maxStudents: maxS,
                status: "upcoming"
            }
        });

        return NextResponse.json({ success: true, session });
    } catch (error: any) {
        console.error("Admin Session Creation Error:", error);
        return NextResponse.json({
            error: "Failed to create session slot",
            details: error.message
        }, { status: 500 });
    }
}
