"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, CheckCircle2, Users, CalendarIcon, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CustomModal } from "@/components/ui/custom-modal"
import { notify } from "@/lib/notifications"
import { Textarea } from "@/components/ui/textarea"
import { AlertModal } from "@/components/ui/alert-modal"

interface Expert {
  id: string
  firstName: string
  lastName: string
  specialization: string[]
  experience: number
  rating: number
  bio?: string
  sessionsCompleted: number
}

export function BookingForm() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [experts, setExperts] = useState<Expert[]>([])
  const [selectedExpert, setSelectedExpert] = useState<string>("")
  const [liveSessions, setLiveSessions] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [bookedDetails, setBookedDetails] = useState<any>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

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

  // Fetch experts from API
  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const response = await fetch("/api/experts")
        if (response.ok) {
          const data = await response.json()
          setExperts(data.experts)
        } else {
          setExperts([])
        }
      } catch (error) {
        console.error("Failed to fetch experts:", error)
        setExperts([])
      }
    }

    fetchExperts()
  }, [])

  // Fetch expert sessions when expert is selected
  useEffect(() => {
    if (!selectedExpert) {
      setLiveSessions([]);
      setSelectedSession("");
      return;
    }

    const fetchExpertSessions = async () => {
      setIsLoadingSessions(true);
      try {
        const res = await fetch(`/api/sessions?expertId=${selectedExpert}`);
        if (res.ok) {
          const data = await res.json();
          setLiveSessions(data.sessions);
        }
      } catch (error) {
        console.error("Failed to fetch expert sessions");
        notify.error("Error", "Could not load available slots for this expert.");
      } finally {
        setIsLoadingSessions(false);
      }
    }
    fetchExpertSessions();
  }, [selectedExpert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !selectedExpert || !selectedSession) {
      notify.error("Selection Required", "Please select an expert and an available slot.")
      return
    }

    // VALIDATION
    if (!selectedSession) {
      setAlertConfig({
        isOpen: true,
        title: "No Session Selected",
        description: "Please select a specific timing slot before proceeding with the booking.",
        variant: "warning",
        confirmText: "Select Slot",
        onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
      });
      return;
    }

    const toastId = notify.loading("Processing your registration...")
    setIsSubmitting(true)

    try {
      const bookingData = {
        expertId: selectedExpert,
        liveSessionId: selectedSession,
        sessionType: "group_counselling",
        scheduledAt: liveSessions.find(s => s.id === selectedSession)?.scheduledAt,
        duration: liveSessions.find(s => s.id === selectedSession)?.duration || 60,
        notes: notes || "Group Session Registration"
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to book session")
      }

      const sessionObj = liveSessions.find(s => s.id === selectedSession);
      const expertObj = experts.find(e => e.id === selectedExpert);

      setBookedDetails({
        expert: expertObj,
        date: new Date(sessionObj.scheduledAt),
        title: sessionObj.title
      })

      notify.dismiss(toastId)
      notify.success("Slot Booked!", "You've successfully registered for this session.")
      setIsSuccessModalOpen(true)

    } catch (error: any) {
      notify.dismiss(toastId)
      setAlertConfig({
        isOpen: true,
        title: "Booking Failed",
        description: error.message || "We encountered an issue while processing your registration. Please try again or contact support if the problem persists.",
        variant: "destructive",
        confirmText: "Try Again",
        onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    setIsSuccessModalOpen(false)
    router.push("/dashboard")
  }

  if (!isLoaded) {
    return <div className="text-center py-20 font-medium">Preparing booking portal...</div>
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto border-none shadow-2xl bg-card/50 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign In Required</CardTitle>
          <CardDescription>
            Please sign in with your student account to join expert counselling sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Button onClick={() => router.push("/sign-in")} className="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/25">
            Get Started
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
        {/* Step 1: Expert Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
            <h2 className="text-xl font-bold">Choose Your Expert</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {experts.map((expert) => (
              <div
                key={expert.id}
                className={cn(
                  "p-5 border-2 rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden group hover:shadow-xl",
                  selectedExpert === expert.id
                    ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                    : "border-muted bg-card hover:border-primary/40 hover:scale-[1.01]"
                )}
                onClick={() => setSelectedExpert(expert.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <User className={cn("h-6 w-6 transition-colors", selectedExpert === expert.id ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
                    ★ {expert.rating}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{expert.firstName} {expert.lastName}</h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">{expert.experience} Years Experience</p>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {expert.specialization.slice(0, 2).map((spec) => (
                    <Badge key={spec} variant="outline" className="text-[10px] px-2 py-0 border-primary/20 bg-primary/5 text-primary/80">
                      {spec}
                    </Badge>
                  ))}
                </div>
                {selectedExpert === expert.id && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white animate-in zoom-in">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Slot Selection */}
        {selectedExpert && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
              <h2 className="text-xl font-bold">Select Available Slot</h2>
            </div>

            {isLoadingSessions ? (
              <div className="p-12 text-center border-2 border-dashed rounded-3xl bg-muted/5">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Checking expert's calendar...</p>
              </div>
            ) : liveSessions.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {liveSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "p-5 border-2 rounded-2xl flex flex-col md:flex-row items-center justify-between transition-all cursor-pointer group hover:shadow-md",
                      selectedSession === session.id
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-muted bg-card hover:border-primary/30"
                    )}
                    onClick={() => setSelectedSession(session.id)}
                  >
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="font-bold text-lg">{session.title}</h4>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          {format(new Date(session.scheduledAt), "EEEE, d MMMM")}
                        </span>
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          {format(new Date(session.scheduledAt), "p")} ({session.duration} min)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-3 mt-4 md:mt-0 min-w-[140px]">
                      <Badge
                        className={cn(
                          "rounded-full px-4 py-1",
                          session._count?.bookings >= session.maxStudents
                            ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        )}
                      >
                        <Users className="h-3 w-3 mr-2" />
                        {session._count?.bookings || 0} / {session.maxStudents} Joined
                      </Badge>
                      {selectedSession === session.id ? (
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          Selected Slot <CheckCircle2 className="h-5 w-5" />
                        </div>
                      ) : session._count?.bookings >= session.maxStudents ? (
                        <span className="text-xs text-destructive font-semibold">FULLY BOOKED</span>
                      ) : (
                        <Button size="sm" variant="outline" className="rounded-full px-6 group-hover:border-primary group-hover:text-primary transition-all">
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center border-2 border-dashed rounded-3xl bg-destructive/5 text-destructive border-destructive/20">
                <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-50" />
                <h3 className="font-bold text-lg mb-1">No Active Slots Found</h3>
                <p className="text-sm">This expert hasn't scheduled any upcoming sessions yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Finalize */}
        {selectedSession && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-2 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
              <h2 className="text-xl font-bold">Personalized Notes</h2>
            </div>
            <Card className="border-none shadow-xl bg-card">
              <CardContent className="pt-6">
                <Textarea
                  placeholder="Is there anything specific you'd like to ask or discuss? (Optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="resize-none rounded-2xl bg-muted/30 border-muted focus-visible:ring-primary"
                />

                <div className="mt-8 flex justify-center">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="px-16 h-14 text-lg font-bold rounded-full shadow-2xl shadow-primary/30 bg-primary hover:scale-105 transition-all w-full md:w-auto"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Confirming Seat...
                      </div>
                    ) : "Register for Session"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </form>

      {/* Success Modal */}
      <CustomModal
        isOpen={isSuccessModalOpen}
        onClose={handleModalClose}
        title="Registration Confirmed!"
      >
        <div className="flex flex-col items-center text-center py-6">
          <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 relative">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
            <div className="absolute inset-0 rounded-full border-4 border-green-500/20 animate-ping" />
          </div>

          <h4 className="text-3xl font-black text-foreground mb-3">You're on the list!</h4>
          <p className="text-muted-foreground mb-8 max-w-xs">
            A confirmation for <b>{bookedDetails?.title}</b> with <b>{bookedDetails?.expert?.firstName}</b> has been sent to your email.
          </p>

          <div className="w-full bg-muted/40 backdrop-blur-sm rounded-[2rem] p-6 mb-10 text-left space-y-4 border border-white/10 shadow-inner">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Topic:</span>
              <span className="font-bold text-primary">{bookedDetails?.title}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Expert:</span>
              <span className="font-bold">{bookedDetails?.expert?.firstName} {bookedDetails?.expert?.lastName}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Time:</span>
              <span className="font-bold font-mono px-3 py-1 bg-background rounded-full border shadow-sm">
                {bookedDetails?.date && format(bookedDetails.date, "p, PPP")}
              </span>
            </div>
          </div>

          <Button onClick={handleModalClose} size="lg" className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/20">
            Go to My Dashboard
          </Button>
        </div>
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
    </>
  )
}