import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { VideoSessionRoom } from "@/components/video-session";
import { Header } from "@/components/header";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const { id } = await params;

    // Verify booking or group session
    let sessionData = null;
    let isExpert = false;

    // Try booking first
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: { expert: true }
    });

    if (booking) {
        sessionData = {
            expertName: `${booking.expert.firstName} ${booking.expert.lastName}`,
            title: booking.sessionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            expertClerkId: booking.expert.clerkId
        };
    } else {
        // Try live session table
        const groupSession = await prisma.liveSession.findUnique({
            where: { id },
            include: { expert: true }
        });

        if (groupSession) {
            sessionData = {
                expertName: `${groupSession.expert.firstName} ${groupSession.expert.lastName}`,
                title: groupSession.title,
                expertClerkId: groupSession.expert.clerkId
            };
        }
    }

    if (!sessionData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold text-destructive mb-2">Session Not Found</h1>
                <p className="text-muted-foreground">The session you're looking for doesn't exist or has been cancelled.</p>
            </div>
        );
    }

    isExpert = sessionData.expertClerkId === userId;
    const expertName = sessionData.expertName;
    const sessionTitle = sessionData.title;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-primary"></div>
                        <p className="text-muted-foreground animate-pulse text-lg">Preparing Live Classroom...</p>
                    </div>
                }>
                    <VideoSessionRoom
                        sessionId={id}
                        isExpert={isExpert}
                        expertName={expertName}
                        sessionTitle={sessionTitle}
                    />
                </Suspense>
            </main>
        </div>
    );
}
