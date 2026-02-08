import { Suspense } from "react";
import { AdminDashboard } from "@/components/admin-dashboard";
import { Header } from "@/components/header";

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-primary"></div>
                        <p className="text-muted-foreground animate-pulse text-lg">Loading Admin Controls...</p>
                    </div>
                }>
                    <AdminDashboard />
                </Suspense>
            </main>

            <footer className="border-t py-12 bg-muted/20 backdrop-blur-md">
                <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
                    <p>© 2026 NIT Career Counselling Admin. All rights reserved.</p>
                    <div className="flex justify-center space-x-6 mt-6">
                        <a href="#" className="hover:text-primary transition-colors">Admin Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Security Audit</a>
                        <a href="#" className="hover:text-primary transition-colors">System Status</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
