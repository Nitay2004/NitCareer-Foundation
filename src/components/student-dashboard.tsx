
"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Calendar,
    Clock,
    User,
    BookOpen,
    FileText,
    MessageSquare,
    ChevronRight,
    TrendingUp,
    Award,
    Video,
    XCircle
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { notify } from "@/lib/notifications"
import { AlertModal } from "./ui/alert-modal"

interface Booking {
    id: string
    sessionType: string
    scheduledAt: string
    duration: number
    status: string
    notes?: string
    expert: {
        firstName: string
        lastName: string
        specialization: string[]
        rating: number
    }
}

export function StudentDashboard() {
    const { user, isLoaded } = useUser()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Alert Modal State
    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        bookingId: string;
        isLoading: boolean;
    }>({
        isOpen: false,
        bookingId: "",
        isLoading: false
    });

    const fetchBookings = async () => {
        try {
            const response = await fetch("/api/bookings")
            if (response.ok) {
                const data = await response.json()
                setBookings(data.bookings)
            }
        } catch (error) {
            console.error("Failed to fetch bookings:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!isLoaded || !user) return
        fetchBookings()
    }, [user, isLoaded])

    const handleCancelBooking = async () => {
        const bookingId = alertModal.bookingId;
        setAlertModal(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" })
            });

            if (!response.ok) throw new Error("Failed to cancel session");

            notify.success("Session Cancelled", "Your booking has been removed from upcoming sessions.");
            fetchBookings(); // Refresh list
            setAlertModal({ isOpen: false, bookingId: "", isLoading: false });
        } catch (error: any) {
            notify.error("Cancellation Failed", error.message);
            setAlertModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    if (!isLoaded || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    const now = new Date()
    const upcomingBookings = bookings.filter(b =>
        (b.status === "pending" || b.status === "confirmed") && new Date(b.scheduledAt) > now
    )
    const pastBookings = bookings.filter(b =>
        b.status === "completed" ||
        b.status === "cancelled" ||
        new Date(b.scheduledAt) <= now
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName || "Student"}!</h1>
                    <p className="text-muted-foreground">Here's an overview of your career journey.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/book-session">
                        <Button>
                            <Calendar className="mr-2 h-4 w-4" />
                            Book New Session
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                        <Clock className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingBookings.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Next session in 2 days</p>
                    </CardContent>
                </Card>
                <Card className="bg-chart-1/5 border-chart-1/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
                        <TrendingUp className="h-4 w-4 text-chart-1" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bookings.filter(b => b.status === "completed").length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Keep up the momentum!</p>
                    </CardContent>
                </Card>
                <Card className="bg-chart-2/5 border-chart-2/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
                        <Award className="h-4 w-4 text-chart-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0%</div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                            <div className="bg-chart-2 h-full" style={{ width: '0%' }}></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Sessions */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Sessions</CardTitle>
                            <CardDescription>View and manage your career counselling appointments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="upcoming" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                                    <TabsTrigger value="past">Past / Cancelled</TabsTrigger>
                                </TabsList>

                                <TabsContent value="upcoming">
                                    {upcomingBookings.length > 0 ? (
                                        <div className="space-y-4">
                                            {upcomingBookings.map((booking) => (
                                                <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-primary/10 rounded-full shrink-0">
                                                            <Calendar className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div className="flex-1 sm:hidden">
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="font-semibold text-lg">{booking.sessionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                                                            </div>
                                                            <Badge variant={booking.status === "confirmed" ? "default" : "secondary"} className="mt-1">
                                                                {booking.status.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="hidden sm:flex items-center justify-between">
                                                            <h3 className="font-semibold text-lg">{booking.sessionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                                                            <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                                                                {booking.status.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex flex-col md:flex-row md:items-center text-sm text-muted-foreground mt-1 gap-2 md:gap-4">
                                                            <span className="flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                {booking.expert.firstName} {booking.expert.lastName}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {format(new Date(booking.scheduledAt), "PPP 'at' p")}
                                                            </span>
                                                        </div>
                                                        {booking.notes && (
                                                            <p className="text-sm mt-2 line-clamp-2 italic text-muted-foreground">&quot;{booking.notes}&quot;</p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 items-center shrink-0 w-full sm:w-auto">
                                                        <Link href={`/sessions/${booking.id}`} className="flex-1 sm:flex-none">
                                                            <Button size="sm" className="w-full sm:w-auto rounded-full bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all font-bold group">
                                                                <Video className="mr-2 h-4 w-4 animate-pulse" />
                                                                Join Session
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 sm:flex-none rounded-full text-destructive hover:bg-destructive/10 border-destructive/20"
                                                            onClick={() => setAlertModal({ isOpen: true, bookingId: booking.id, isLoading: false })}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="hidden lg:inline-flex">
                                                            <ChevronRight className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                                            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <h3 className="text-lg font-medium">No upcoming sessions</h3>
                                            <p className="text-muted-foreground mb-6">You haven't booked any sessions yet. Get expert advice today!</p>
                                            <Link href="/book-session">
                                                <Button variant="outline">Schedule your first session</Button>
                                            </Link>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="past">
                                    {pastBookings.length > 0 ? (
                                        <div className="space-y-4">
                                            {pastBookings.map((booking) => (
                                                <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4 opacity-75 grayscale-50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-muted rounded-full shrink-0">
                                                            <Calendar className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex-1 sm:hidden">
                                                            <h3 className="font-semibold text-lg">{booking.sessionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                                                            <Badge variant="outline" className="mt-1">
                                                                {booking.status.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="hidden sm:flex items-center justify-between">
                                                            <h3 className="font-semibold text-lg">{booking.sessionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                                                            <Badge variant="outline">
                                                                {booking.status.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex flex-col md:flex-row md:items-center text-sm text-muted-foreground mt-1 gap-2 md:gap-4">
                                                            <span className="flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                {booking.expert.firstName} {booking.expert.lastName}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {format(new Date(booking.scheduledAt), "PPP")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 w-full sm:w-auto">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="w-full sm:w-auto rounded-full"
                                                            onClick={() => notify.info("Session Recap", "Details for past sessions will be available once the expert uploads notes.")}
                                                        >
                                                            Recap / Notes
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            No past sessions to show.
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Quick Actions & Progress */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Suggested Tasks</CardTitle>
                            <CardDescription>Next steps for your career</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No tasks available at the moment. Complete your profile to get suggestions.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-linear-to-br from-primary/10 to-primary/5 border-none shadow-none">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                                    <GraduationCap className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Contact our support team if you have any questions about your sessions or profile.
                                </p>
                                <Button variant="secondary" className="w-full">Get Support</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                onConfirm={handleCancelBooking}
                isLoading={alertModal.isLoading}
                title="Cancel Counselling Session"
                description="Are you sure you want to cancel this session? This action cannot be undone and your slot will be made available to other students."
                variant="destructive"
                confirmText="Yes, Cancel Session"
            />
        </div>
    )
}

function GraduationCap(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        </svg>
    )
}
