import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { status } = body;

        if (!["cancelled", "completed"].includes(status)) {
            return NextResponse.json({ error: "Invalid status update" }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { student: true, expert: true }
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Only the student who owns the booking or the expert assigned can cancel it
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        const expert = await prisma.expert.findUnique({ where: { clerkId: userId } });

        if (booking.studentId !== user?.id && booking.expertId !== expert?.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, booking: updatedBooking });
    } catch (error) {
        console.error("Error updating booking:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
