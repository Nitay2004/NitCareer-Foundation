import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await request.json()
        const { firstName, lastName, email, specialization, bio, experience } = body

        // BASIC VALIDATION
        if (!firstName || firstName.trim() === "") {
            return NextResponse.json({ error: "First name is required" }, { status: 400 });
        }
        if (!lastName || lastName.trim() === "") {
            return NextResponse.json({ error: "Last name is required" }, { status: 400 });
        }
        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
        }

        const expValue = parseInt(experience);
        if (isNaN(expValue) || expValue < 0) {
            return NextResponse.json({
                error: "Invalid experience",
                details: "Years of experience cannot be negative."
            }, { status: 400 });
        }

        // Log the attempt for debugging
        console.log("Creating expert for:", email);

        // Check if the current user is registering themselves as an expert
        const currentUser = await (await import('@clerk/nextjs/server')).currentUser();
        const isSelfRegistration = currentUser?.emailAddresses?.some((e: any) => e.emailAddress === email);

        const expert = await prisma.expert.create({
            data: {
                clerkId: isSelfRegistration ? userId : `expert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                firstName: firstName || "Expert",
                lastName: lastName || "",
                email,
                specialization: specialization || [],
                bio: bio || "",
                experience: parseInt(experience) || 0,
                isActive: true
            }
        })

        return NextResponse.json({ success: true, expert })
    } catch (error: any) {
        console.error("Expert Creation Error Details:", error);

        // Handle unique constraint (duplicate email)
        if (error.code === 'P2002') {
            return NextResponse.json({
                error: "An expert with this email already exists."
            }, { status: 409 })
        }

        return NextResponse.json({
            error: "Failed to create expert",
            details: error?.message || "Unknown error"
        }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await request.json()
        const { id, isActive, isDeleted } = body

        const expert = await prisma.expert.update({
            where: { id },
            data: {
                ...(isActive !== undefined && { isActive }),
                ...(isDeleted !== undefined && { isDeleted })
            }
        })

        return NextResponse.json({ success: true, expert })
    } catch (error) {
        console.error("Expert Update Error:", error);
        return NextResponse.json({ error: "Failed to update expert" }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const deleted = searchParams.get("deleted") === "true"

        const experts = await prisma.expert.findMany({
            where: { isDeleted: deleted },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json({ success: true, experts })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch experts" }, { status: 500 })
    }
}
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        const permanent = searchParams.get("permanent") === "true"

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })

        if (permanent) {
            await prisma.expert.delete({
                where: { id }
            })
        } else {
            await prisma.expert.update({
                where: { id },
                data: { isDeleted: true, isActive: false }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Expert Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete expert" }, { status: 500 })
    }
}
