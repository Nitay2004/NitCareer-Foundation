import { Suspense } from "react"
import { BookingForm } from "@/components/booking-form"
import { Header } from "@/components/header"

export default function BookSessionPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
              Book a Counselling Session
            </h1>
            <p className="text-lg text-muted-foreground">
              Schedule a one-on-one session with our expert career counsellors
            </p>
          </div>
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <BookingForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}