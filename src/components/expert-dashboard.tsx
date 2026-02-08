"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Users, Calendar, Video, MessageSquare,
    CheckCircle, Clock, ChevronRight, Share2, Plus, Info, LayoutDashboard, ShieldAlert,
    Star, GraduationCap, Zap, Activity, User, BookOpen, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import Link from "next/link";
import { notify } from "@/lib/notifications";
import { CustomModal } from "@/components/ui/custom-modal";
import { AlertModal } from "@/components/ui/alert-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Booking {
    id: string;
    sessionType: string;
    scheduledAt: string;
    duration: number;
    status: string;
    notes?: string;
    liveSessionId?: string;
    student: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface ExpertDashboardProps {
    expertId?: string;
    isAdminView?: boolean;
}

export function ExpertDashboard({ expertId, isAdminView = false }: ExpertDashboardProps) {
    const { user, isLoaded } = useUser();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [pastBookings, setPastBookings] = useState<Booking[]>([]);
    const [liveSessions, setLiveSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expertInfo, setExpertInfo] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isNotExpert, setIsNotExpert] = useState(false);

    // Modals
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        variant: "info" | "success" | "warning" | "destructive";
        confirmText?: string;
        onConfirm?: () => void;
        isLoading?: boolean;
    }>({
        isOpen: false,
        title: "",
        description: "",
        variant: "info",
    });

    // Forms
    const [profileForm, setProfileForm] = useState({
        bio: "",
        specialization: "",
        experience: ""
    });

    const [sessionForm, setSessionForm] = useState({
        title: "",
        description: "",
        sessionType: "group_counselling",
        scheduledAt: "",
        duration: "60",
        maxStudents: "50"
    });

    useEffect(() => {
        if (!isAdminView && (!isLoaded || !user)) return;

        const fetchExpertData = async () => {
            try {
                const url = isAdminView
                    ? `/api/admin/experts/${expertId}/dashboard`
                    : "/api/expert/bookings";

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setBookings(data.bookings || []);
                    setLiveSessions(data.liveSessions || []);

                    const expert = data.expert;
                    if (isAdminView) setExpertInfo(expert);

                    // Pre-fill profile form
                    if (expert) {
                        setProfileForm({
                            bio: expert.bio || "",
                            specialization: expert.specialization?.join(", ") || "",
                            experience: expert.experience?.toString() || ""
                        });
                    }
                } else if (response.status === 403 || response.status === 404) {
                    setIsNotExpert(true);
                }
            } catch (error) {
                console.error("Failed to fetch expert data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExpertData();
    }, [user, isLoaded, expertId, isAdminView]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDATION
        const exp = parseInt(profileForm.experience);
        if (isNaN(exp) || exp < 0) {
            setAlertConfig({
                isOpen: true,
                title: "Invalid Experience",
                description: "Years of experience cannot be negative. Please enter a valid number (0 or higher).",
                variant: "warning",
                confirmText: "Correct Experience",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
            });
            return;
        }

        if (!profileForm.specialization.trim()) {
            setAlertConfig({
                isOpen: true,
                title: "Incomplete Profile",
                description: "Please provide at least one specialization so students know your expertise.",
                variant: "warning",
                confirmText: "Add Specialization",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
            });
            return;
        }

        const toastId = notify.loading("Updating profile...");
        try {
            const res = await fetch("/api/expert/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileForm)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update profile");
            }

            notify.dismiss(toastId);
            notify.success("Profile Updated", "Your changes have been saved.");
            setIsProfileModalOpen(false);

            const data = await res.json();
            if (!isAdminView) setExpertInfo(data.expert);
        } catch (err: any) {
            notify.dismiss(toastId);
            setAlertConfig({
                isOpen: true,
                title: "Update Failed",
                description: err.message || "An unexpected error occurred while updating your profile.",
                variant: "destructive",
                confirmText: "Try Again",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
            });
        }
    };

    const handleScheduleSession = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDATION
        if (parseInt(sessionForm.duration) <= 0) {
            setAlertConfig({
                isOpen: true,
                title: "Invalid Duration",
                description: "Session duration must be greater than zero minutes.",
                variant: "warning",
                confirmText: "Fix Duration",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
            });
            return;
        }

        if (parseInt(sessionForm.maxStudents) <= 0) {
            setAlertConfig({
                isOpen: true,
                title: "Invalid Capacity",
                description: "Student capacity must be at least 1.",
                variant: "warning",
                confirmText: "Fix Capacity",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
            });
            return;
        }

        const toastId = notify.loading("Creating session slot...");
        try {
            const url = isAdminView ? "/api/admin/sessions" : "/api/expert/sessions";
            const body = isAdminView ? { ...sessionForm, expertId } : sessionForm;

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create session slot");
            }

            notify.dismiss(toastId);
            notify.success("Session Scheduled", "Your new session slot has been created.");
            setIsScheduleModalOpen(false);
            setSessionForm({
                title: "",
                description: "",
                sessionType: "group_counselling",
                scheduledAt: "",
                duration: "60",
                maxStudents: "50"
            });

            // Refresh sessions list
            const sessionsUrl = isAdminView ? "/api/admin/sessions" : "/api/expert/bookings";
            const sessRes = await fetch(sessionsUrl);
            const sessData = await sessRes.json();
            setLiveSessions(sessData.liveSessions || []);
        } catch (err: any) {
            notify.dismiss(toastId);
            setAlertConfig({
                isOpen: true,
                title: "Scheduling Failed",
                description: err.message || "Could not create the session slot. Please check your inputs.",
                variant: "destructive",
                confirmText: "Try Again",
                onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
            });
        }
    };

    const toggleShare = () => {
        const shareUrl = `${window.location.origin}/experts/${expertId || 'profile'}`;
        navigator.clipboard.writeText(shareUrl);
        notify.info("Profile Link Copied", "Share this with students so they can find your slots.");
    };

    const displayUser = isAdminView ? expertInfo : user;

    if (isNotExpert && !isAdminView) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-6">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
                    <ShieldAlert className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="max-w-md">
                    <h2 className="text-2xl font-bold">Expert Access Only</h2>
                    <p className="text-muted-foreground mt-2">
                        Your account is not registered as an Expert. Please use the Student Dashboard.
                    </p>
                </div>
                <Link href="/book-session">
                    <Button className="rounded-full px-8">Visit Student Hub</Button>
                </Link>
            </div>
        );
    }

    if (isLoading || (!isAdminView && !isLoaded)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const totalStudents = [...new Set(bookings.map(b => b.student.email))].length;
    const upcomingSessions = liveSessions.filter(s => s.status === "upcoming");

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expert Dashboard</h1>
                    <p className="text-muted-foreground">Manage your sessions and connect with students.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsScheduleModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Session Slot
                    </Button>
                    <Button variant="outline" onClick={toggleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Profile
                    </Button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Students</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                        <p className="text-xs text-muted-foreground mt-1">Unique student reach</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{liveSessions.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Sessions created</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                        <Star className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98%</div>
                        <p className="text-xs text-muted-foreground mt-1">Average student rating</p>
                    </CardContent>
                </Card>
                <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingSessions.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Scheduled for future</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Sessions */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Session Slots</CardTitle>
                            <CardDescription>View and manage the sessions you have scheduled.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {liveSessions.length > 0 ? (
                                    liveSessions.map((session) => (
                                        <div key={session.id} className="flex flex-col sm:flex-row sm:items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                                            <div className="p-3 bg-primary/10 rounded-full w-fit">
                                                <Video className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="font-semibold text-lg">{session.title}</h3>
                                                    <Badge variant={session.status === "upcoming" ? "default" : "secondary"}>
                                                        {session.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-x-4 gap-y-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(session.scheduledAt), "PPP 'at' p")}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {session._count?.bookings ?? 0} / {session.maxStudents} Booked
                                                    </span>
                                                </div>
                                                {session.description && (
                                                    <p className="text-sm mt-2 text-muted-foreground line-clamp-1">{session.description}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <Link href={`/sessions/${session.id}`} className="flex-1 sm:flex-none">
                                                    <Button size="sm" className="w-full font-bold">
                                                        Start Session
                                                    </Button>
                                                </Link>
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    notify.info("Student Roster", `${session._count?.bookings || 0} students have booked this session.`);
                                                }}>
                                                    Roster
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                                        <Video className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium">No sessions created</h3>
                                        <p className="text-muted-foreground mb-6">Create your first session slot to start helping students.</p>
                                        <Button onClick={() => setIsScheduleModalOpen(true)}>Initialize First Slot</Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Profile & Quick Links */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="h-20 w-20 bg-muted rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-4">
                                {displayUser?.firstName?.[0]}
                            </div>
                            <CardTitle>
                                {isAdminView ? `${displayUser?.firstName} ${displayUser?.lastName}` : displayUser?.fullName}
                            </CardTitle>
                            <CardDescription>
                                {isAdminView ? displayUser?.email : displayUser?.emailAddresses?.[0]?.emailAddress}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full" onClick={() => setIsProfileModalOpen(true)}>
                                <User className="mr-2 h-4 w-4" /> Edit Profile
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Expert Resources</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="ghost" className="w-full justify-start text-sm h-9" asChild>
                                <Link href="#">
                                    <BookOpen className="mr-2 h-4 w-4 text-primary" /> Teaching Guide
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-sm h-9" asChild>
                                <Link href="#">
                                    <MessageSquare className="mr-2 h-4 w-4 text-blue-500" /> Community
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-sm h-9" asChild>
                                <Link href="#">
                                    <Settings className="mr-2 h-4 w-4 text-orange-500" /> Session Settings
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <CustomModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                title="Edit Expert Profile"
            >
                <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Professional Bio</Label>
                        <Textarea
                            placeholder="Tell students about your expertise..."
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                            className="min-h-[100px]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Experience (Years)</Label>
                            <Input
                                type="number"
                                value={profileForm.experience}
                                onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Specialization</Label>
                            <Input
                                placeholder="HR, Coding, Tech"
                                value={profileForm.specialization}
                                onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" type="button" onClick={() => setIsProfileModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </CustomModal>

            <CustomModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                title="Create Session Slot"
            >
                <form onSubmit={handleScheduleSession} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            placeholder="e.g. Resume Workshop"
                            value={sessionForm.title}
                            onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Agenda</Label>
                        <Textarea
                            placeholder="What will you cover?"
                            value={sessionForm.description}
                            onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date & Time</Label>
                            <Input
                                type="datetime-local"
                                value={sessionForm.scheduledAt}
                                onChange={(e) => setSessionForm({ ...sessionForm, scheduledAt: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Duration</Label>
                            <Select
                                value={sessionForm.duration}
                                onValueChange={(v) => setSessionForm({ ...sessionForm, duration: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="1 Hour" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 Mins</SelectItem>
                                    <SelectItem value="60">1 Hour</SelectItem>
                                    <SelectItem value="90">1.5 Hours</SelectItem>
                                    <SelectItem value="120">2 Hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Participant Limit (Max 50)</Label>
                        <Input
                            type="number"
                            max="50"
                            min="1"
                            value={sessionForm.maxStudents}
                            onChange={(e) => setSessionForm({ ...sessionForm, maxStudents: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" type="button" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Slot</Button>
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
