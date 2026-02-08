import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const expert = await prisma.expert.findUnique({
            where: { clerkId: userId }
        });

        if (!expert) return NextResponse.json({ error: "Expert not found" }, { status: 404 });

        const body = await request.json();
        const { title, description, sessionType, scheduledAt, duration, maxStudents } = body;

        if (!title || !scheduledAt) {
            return NextResponse.json({ error: "Title and Date are required" }, { status: 400 });
        }

        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
            return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }

        if (scheduledDate < new Date()) {
            return NextResponse.json({ error: "Cannot schedule sessions in the past" }, { status: 400 });
        }

        const dur = parseInt(duration);
        if (isNaN(dur) || dur <= 0) {
            return NextResponse.json({ error: "Duration must be a positive number" }, { status: 400 });
        }

        const maxS = parseInt(maxStudents);
        if (isNaN(maxS) || maxS <= 0) {
            return NextResponse.json({ error: "Maximum students must be at least 1" }, { status: 400 });
        }

        const session = await prisma.liveSession.create({
            data: {
                expertId: expert.id,
                title,
                description,
                sessionType: sessionType || "group_counselling",
                scheduledAt: scheduledDate,
                duration: parseInt(duration) || 60,
                maxStudents: parseInt(maxStudents) || 50,
                status: "upcoming"
            }
        });

        return NextResponse.json({ success: true, session });
    } catch (error) {
        console.error("Session Scheduling Error:", error);
        return NextResponse.json({ error: "Failed to schedule session" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const expert = await prisma.expert.findUnique({
            where: { clerkId: userId }
        });

        if (!expert) return NextResponse.json({ error: "Expert not found" }, { status: 404 });

        const sessions = await prisma.liveSession.findMany({
            where: { expertId: expert.id },
            include: {
                _count: {
                    select: { bookings: true }
                },
                bookings: {
                    include: {
                        student: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                profileImage: true
                            }
                        }
                    }
                }
            },
            orderBy: { scheduledAt: 'desc' }
        });

        return NextResponse.json({ sessions });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }
}
