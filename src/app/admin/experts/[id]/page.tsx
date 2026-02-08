import { Suspense } from "react";
import { ExpertDashboard } from "@/components/expert-dashboard";
import { Header } from "@/components/header";

export const dynamic = 'force-dynamic';

export default async function AdminExpertPreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-primary uppercase tracking-widest">Admin View</h2>
                </div>
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                }>
                    <ExpertDashboard expertId={id} isAdminView={true} />
                </Suspense>
            </main>
        </div>
    );
}
