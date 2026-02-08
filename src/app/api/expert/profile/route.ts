import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET current expert profile
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const expert = await prisma.expert.findUnique({
            where: { clerkId: userId }
        });

        if (!expert) return NextResponse.json({ error: "Expert not found" }, { status: 404 });

        return NextResponse.json({ expert });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH update expert profile
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { bio, specialization, experience } = body;

        if (experience !== undefined) {
            const expValue = parseInt(experience);
            if (isNaN(expValue) || expValue < 0) {
                return NextResponse.json({
                    error: "Invalid experience value",
                    details: "Years of experience cannot be negative."
                }, { status: 400 });
            }
        }

        const expert = await prisma.expert.update({
            where: { clerkId: userId },
            data: {
                bio,
                specialization: Array.isArray(specialization) ? specialization : specialization?.split(',').map((s: string) => s.trim()).filter(Boolean),
                experience: parseInt(experience) || undefined
            }
        });

        return NextResponse.json({ success: true, expert });
    } catch (error) {
        console.error("Profile Update Error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
