import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { ExpertDashboard } from "@/components/expert-dashboard"
import { StudentDashboard } from "@/components/student-dashboard"
import { Header } from "@/components/header"

export default async function DashboardPage() {
    const { userId } = await auth()

    // Check if user is an expert
    const expert = userId ? await prisma.expert.findUnique({
        where: { clerkId: userId }
    }) : null

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                }>
                    {/* Default to StudentDashboard, but ExpertDashboard has its own internal check */}
                    {expert ? <ExpertDashboard /> : <StudentDashboard />}
                </Suspense>
            </main>

            {/* Footer / Extra info */}
            <footer className="border-t py-12 bg-muted/20">
                <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
                    <p>© 2026 NIT Career Counselling. All rights reserved.</p>
                    <div className="flex justify-center space-x-4 mt-4">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
