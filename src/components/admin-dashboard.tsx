"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Calendar,
    UserCheck,
    TrendingUp,
    Plus,
    ShieldAlert,
    MoreVertical,
    CheckCircle,
    XCircle,
    Mail,
    Search,
    LayoutDashboard,
    GraduationCap,
    Clock,
    Video
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell
} from "recharts";
import { notify } from "@/lib/notifications";
import { CustomModal } from "@/components/ui/custom-modal";
import { AlertModal } from "@/components/ui/alert-modal";

export function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [experts, setExperts] = useState<any[]>([]);
    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [liveSessions, setLiveSessions] = useState<any[]>([]);
    const [archivedExperts, setArchivedExperts] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [isAddExpertOpen, setIsAddExpertOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [newExpert, setNewExpert] = useState({
        firstName: "",
        lastName: "",
        email: "",
        specialization: "",
        bio: "",
        experience: ""
    });

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        variant: "destructive" | "warning";
        onConfirm: () => void;
        confirmText: string;
        isLoading: boolean;
    }>({
        isOpen: false,
        title: "",
        description: "",
        variant: "warning",
        onConfirm: () => { },
        confirmText: "Continue",
        isLoading: false
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/stats");
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setStats(data.stats);
            setExperts(data.experts);
            setRecentBookings(data.recentBookings);

            // Fetch live sessions
            const sessionsRes = await fetch("/api/admin/sessions");
            const sessionsData = await sessionsRes.json();
            setLiveSessions(sessionsData.sessions || []);

            // Fetch archived experts
            const archivedRes = await fetch("/api/admin/experts?deleted=true");
            const archivedData = await archivedRes.json();
            setArchivedExperts(archivedData.experts || []);
        } catch (err: any) {
            notify.error("Data Fetch Failed", err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpertStatus = async (id: string, currentStatus: boolean) => {
        setAlertConfig(prev => ({ ...prev, isLoading: true }));
        try {
            const res = await fetch("/api/admin/experts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isActive: !currentStatus })
            });
            if (!res.ok) throw new Error("Failed to update status");

            const isArchived = archivedExperts.some(e => e.id === id);
            if (isArchived) {
                setArchivedExperts(archivedExperts.map(e => e.id === id ? { ...e, isActive: !currentStatus } : e));
            } else {
                setExperts(experts.map(e => e.id === id ? { ...e, isActive: !currentStatus } : e));
            }

            notify.success("Status Updated", `Expert has been ${!currentStatus ? 'activated' : 'deactivated'}.`);
            setAlertConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
            notify.error("Update Failed", err.message);
            setAlertConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleRestoreExpert = async (id: string) => {
        setAlertConfig(prev => ({ ...prev, isLoading: true }));
        try {
            const res = await fetch("/api/admin/experts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isDeleted: false, isActive: true })
            });
            if (!res.ok) throw new Error("Restoration failed");

            notify.success("Expert Restored", "The expert has been moved back to the active directory.");
            fetchDashboardData();
            setAlertConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
            notify.error("Restore Failed", err.message);
            setAlertConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleDeleteExpert = async (id: string, permanent: boolean = false) => {
        setAlertConfig(prev => ({ ...prev, isLoading: true }));
        try {
            const url = `/api/admin/experts?id=${id}${permanent ? '&permanent=true' : ''}`;
            const res = await fetch(url, { method: 'DELETE' });
            if (!res.ok) throw new Error(permanent ? "Permanent delete failed" : "Delete failed");

            notify.success(
                permanent ? "Expert Purged" : "Expert Archived",
                permanent ? "The record has been permanently removed." : "Expert moved to Past Experts gallery."
            );
            fetchDashboardData();
            setAlertConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
            notify.error("Action Failed", err.message);
            setAlertConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleAddExpert = async (e: React.FormEvent) => {
        e.preventDefault();

        // FRONTEND VALIDATION
        if (!newExpert.firstName.trim() || !newExpert.lastName.trim()) {
            setAlertConfig({
                isOpen: true,
                title: "Incomplete Form",
                description: "Please provide both first and last names for the expert.",
                variant: "warning",
                confirmText: "Got it",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
                isLoading: false
            });
            return;
        }

        if (!newExpert.email.includes("@")) {
            setAlertConfig({
                isOpen: true,
                title: "Invalid Email",
                description: "Please provide a valid email address for the expert.",
                variant: "warning",
                confirmText: "Fix Email",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
                isLoading: false
            });
            return;
        }

        const exp = parseInt(newExpert.experience);
        if (isNaN(exp) || exp < 0) {
            setAlertConfig({
                isOpen: true,
                title: "Invalid Experience",
                description: "Years of experience cannot be negative. Please enter a valid number (0 or higher).",
                variant: "warning",
                confirmText: "Correct Experience",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
                isLoading: false
            });
            return;
        }

        const toastId = notify.loading("Registering expert...");
        try {
            const res = await fetch("/api/admin/experts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newExpert,
                    specialization: newExpert.specialization.split(",").map(s => s.trim()).filter(Boolean)
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to register expert");
            }

            notify.dismiss(toastId);
            notify.success("Expert Registered", `${newExpert.firstName} has been added successfully.`);
            setIsAddExpertOpen(false);
            setNewExpert({ firstName: "", lastName: "", email: "", specialization: "", bio: "", experience: "" });
            fetchDashboardData();
        } catch (err: any) {
            notify.dismiss(toastId);
            setAlertConfig({
                isOpen: true,
                title: "Registration Failed",
                description: err.message || "An unexpected error occurred while registering the expert.",
                variant: "destructive",
                confirmText: "Try Again",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
                isLoading: false
            });
        }
    };

    const dashboardData = [
        { name: "Mon", bookings: stats?.stats?.bookings > 0 ? Math.floor(stats.stats.bookings * 0.1) : 0 },
        { name: "Tue", bookings: stats?.stats?.bookings > 0 ? Math.floor(stats.stats.bookings * 0.15) : 0 },
        { name: "Wed", bookings: stats?.stats?.bookings > 0 ? Math.floor(stats.stats.bookings * 0.25) : 0 },
        { name: "Thu", bookings: stats?.stats?.bookings > 0 ? Math.floor(stats.stats.bookings * 0.2) : 0 },
        { name: "Fri", bookings: stats?.stats?.bookings > 0 ? Math.floor(stats.stats.bookings * 0.3) : 0 },
        { name: "Sat", bookings: stats?.stats?.bookings > 0 ? Math.floor(stats.stats.bookings * 0.05) : 0 },
        { name: "Sun", bookings: stats?.stats?.bookings > 0 ? Math.floor(stats.stats.bookings * 0.05) : 0 },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse text-lg">Initializing Admin Control Center...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        Admin Overview
                    </h1>
                    <p className="text-muted-foreground">Monitor and manage the NIT Career Counselling platform.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => fetchDashboardData()} className="rounded-full">
                        Refresh Data
                    </Button>
                    <Button onClick={() => setIsAddExpertOpen(true)} className="rounded-full shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Add Expert
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-xl bg-linear-to-br from-primary/5 to-transparent backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.students || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl bg-linear-to-br from-blue-500/5 to-transparent backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Active Experts</CardTitle>
                        <UserCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.experts || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl bg-linear-to-br from-green-500/5 to-transparent backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.bookings || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl bg-linear-to-br from-orange-500/5 to-transparent backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Revenue (Est.)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.revenue?.toLocaleString() || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-full">
                    <TabsTrigger value="overview" className="rounded-full px-6">Analytics Overview</TabsTrigger>
                    <TabsTrigger value="experts" className="rounded-full px-6">Manage Experts</TabsTrigger>
                    <TabsTrigger value="archived" className="rounded-full px-6">Past Experts</TabsTrigger>
                    <TabsTrigger value="sessions" className="rounded-full px-6">Live Sessions</TabsTrigger>
                    <TabsTrigger value="bookings" className="rounded-full px-6">Bookings Log</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-none shadow-xl bg-card">
                            <CardHeader>
                                <CardTitle>Session Traffic</CardTitle>
                                <CardDescription>Number of counselling sessions booked this week.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] pl-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboardData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: '#F1F5F9' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="bookings" radius={[4, 4, 0, 0]}>
                                            {dashboardData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 4 ? '#3b82f6' : '#cbd5e1'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-card">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Latest bookings on the platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {recentBookings.map((booking: any) => (
                                    <div key={booking.id} className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <GraduationCap className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {booking.student.firstName} {booking.student.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Booked with {booking.expert.firstName}
                                            </p>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(booking.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="experts" className="animate-in fade-in duration-500">
                    <Card className="border-none shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Expert Directory</CardTitle>
                                <CardDescription>Manage your team of career counsellors.</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filter by name..."
                                    className="pl-9 rounded-full bg-muted/50 border-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rating</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {experts
                                            .filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((expert) => (
                                                <tr key={expert.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">
                                                        <Link href={`/admin/experts/${expert.id}`} className="hover:text-primary transition-colors cursor-pointer group">
                                                            <div className="font-semibold group-hover:underline">{expert.firstName} {expert.lastName}</div>
                                                            <div className="text-xs text-muted-foreground">{expert.email}</div>
                                                        </Link>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <Badge variant={expert.isActive ? "default" : "secondary"} className="rounded-full">
                                                            {expert.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center">⭐ {expert.rating || 0}</div>
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setAlertConfig({
                                                                    isOpen: true,
                                                                    title: expert.isActive ? "Deactivate Expert" : "Activate Expert",
                                                                    description: expert.isActive
                                                                        ? `Are you sure you want to deactivate ${expert.firstName}? They will no longer be able to host sessions.`
                                                                        : `Are you sure you want to reactivate ${expert.firstName}? They will be able to host sessions again.`,
                                                                    variant: "warning",
                                                                    confirmText: expert.isActive ? "Deactivate" : "Activate",
                                                                    onConfirm: () => toggleExpertStatus(expert.id, expert.isActive),
                                                                    isLoading: false
                                                                })}
                                                            >
                                                                {expert.isActive ? "Deactivate" : "Activate"}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:bg-destructive/10"
                                                                onClick={() => setAlertConfig({
                                                                    isOpen: true,
                                                                    title: "Delete Expert",
                                                                    description: `Are you sure you want to permanently delete ${expert.firstName}? This action cannot be undone and all their session history will be archived.`,
                                                                    variant: "destructive",
                                                                    confirmText: "Delete Permanently",
                                                                    onConfirm: () => handleDeleteExpert(expert.id),
                                                                    isLoading: false
                                                                })}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sessions" className="animate-in fade-in duration-500">
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle>Session Monitor</CardTitle>
                            <CardDescription>Real-time overview of expert slots and registrations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {liveSessions.length > 0 ? (
                                    liveSessions.map((session) => (
                                        <div key={session.id} className="flex flex-col md:flex-row items-center p-5 border rounded-2lx bg-muted/20 gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg">{session.title}</h3>
                                                    <Badge variant="outline">{session.status.toUpperCase()}</Badge>
                                                </div>
                                                <div className="flex items-center text-sm text-muted-foreground gap-4">
                                                    <span className="flex items-center gap-1">
                                                        <ShieldAlert className="h-3 w-3" />
                                                        Expert: {session.expert.firstName} {session.expert.lastName}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(session.scheduledAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <div className="text-xl font-bold text-primary">{session._count.bookings}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">Students</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xl font-bold">{session.maxStudents}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">Capacity</div>
                                                </div>
                                                <Link href={`/sessions/${session.id}`}>
                                                    <Button size="sm" variant="outline" className="rounded-full">Join Monitor</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-3xl">
                                        <Video className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>No active sessions or slots found.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="archived" className="animate-in fade-in duration-500">
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle>Past Experts</CardTitle>
                            <CardDescription>Reactivate career experts who were previously removed.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {archivedExperts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b transition-colors hover:bg-muted/50">
                                                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Expert</th>
                                                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Reason/Status</th>
                                                <th className="h-12 px-4 text-right font-medium text-muted-foreground">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {archivedExperts.map((expert) => (
                                                <tr key={expert.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold">
                                                            {expert.firstName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{expert.firstName} {expert.lastName}</div>
                                                            <div className="text-xs text-muted-foreground">{expert.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant="outline" className="text-orange-500 border-orange-500/30">Archived</Badge>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-full hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30"
                                                                onClick={() => setAlertConfig({
                                                                    isOpen: true,
                                                                    title: "Restore Expert",
                                                                    description: `Are you sure you want to reactivate ${expert.firstName}? They will be restored to the active directory and can start booking sessions immediately.`,
                                                                    variant: "warning",
                                                                    confirmText: "Yes, Restore Account",
                                                                    onConfirm: () => handleRestoreExpert(expert.id),
                                                                    isLoading: false
                                                                })}
                                                            >
                                                                Restore Expert
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:bg-destructive/10 rounded-full"
                                                                onClick={() => setAlertConfig({
                                                                    isOpen: true,
                                                                    title: "Permanent Deletion",
                                                                    description: `CRITICAL: You are about to permanently delete ${expert.firstName}. This will purge all their data from the database. This action is IRREVERSIBLE.`,
                                                                    variant: "destructive",
                                                                    confirmText: "Delete Forever",
                                                                    onConfirm: () => handleDeleteExpert(expert.id, true),
                                                                    isLoading: false
                                                                })}
                                                            >
                                                                Delete Forever
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                    <h3 className="text-lg font-medium">No archived records</h3>
                                    <p className="text-sm text-muted-foreground">When you delete an expert, they will appear here for potential restoration.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bookings" className="animate-in fade-in duration-500">
                    <Card className="border-none shadow-xl">
                        {/* Component logic for viewing all bookings can go here */}
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Full booking logs will be displayed here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add Expert Modal */}
            <CustomModal
                isOpen={isAddExpertOpen}
                onClose={() => setIsAddExpertOpen(false)}
                title="Register New Expert"
            >
                <form className="space-y-4" onSubmit={handleAddExpert}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">First Name</label>
                            <Input
                                placeholder="John"
                                value={newExpert.firstName}
                                onChange={(e) => setNewExpert({ ...newExpert, firstName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Last Name</label>
                            <Input
                                placeholder="Doe"
                                value={newExpert.lastName}
                                onChange={(e) => setNewExpert({ ...newExpert, lastName: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input
                            placeholder="john@example.com"
                            type="email"
                            value={newExpert.email}
                            onChange={(e) => setNewExpert({ ...newExpert, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Years of Experience</label>
                        <Input
                            placeholder="5"
                            type="number"
                            value={newExpert.experience}
                            onChange={(e) => setNewExpert({ ...newExpert, experience: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Specialization (Comma separated)</label>
                        <Input
                            placeholder="Software Eng, Career Coaching"
                            value={newExpert.specialization}
                            onChange={(e) => setNewExpert({ ...newExpert, specialization: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Short Bio</label>
                        <Input
                            placeholder="Brief introduction..."
                            value={newExpert.bio}
                            onChange={(e) => setNewExpert({ ...newExpert, bio: e.target.value })}
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button variant="outline" className="flex-1" type="button" onClick={() => setIsAddExpertOpen(false)}>Cancel</Button>
                        <Button className="flex-1 shadow-lg shadow-primary/20">Register Expert</Button>
                    </div>
                </form>
            </CustomModal>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={alertConfig.onConfirm}
                title={alertConfig.title}
                description={alertConfig.description}
                variant={alertConfig.variant}
                confirmText={alertConfig.confirmText}
                isLoading={alertConfig.isLoading}
            />
        </div>
    );
}
