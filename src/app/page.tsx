import Link from "next/link"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCheck, FileText, MessageSquare, Search, BookOpen, Calendar } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            NIT Career Counselling
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground mb-6">
            Shape Your Future with
            <span className="text-primary"> Expert Guidance</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get personalized career counselling from NIT alumni and industry experts.
            Discover your path to success in engineering and technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <SignInButton>
                <Button size="lg" className="text-lg px-8">
                  Get Started
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  Go to Dashboard
                </Button>
              </Link>
            </SignedIn>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Our Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive career support tailored for NIT students and graduates.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-6 w-6 text-primary" />
                  <CardTitle>Career Assessment</CardTitle>
                </div>
                <CardDescription>
                  Discover your strengths and interests with our comprehensive assessment tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Take Assessment
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <CardTitle>Resume Building</CardTitle>
                </div>
                <CardDescription>
                  Create professional resumes that stand out to employers and recruiters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Build Resume
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <CardTitle>Interview Preparation</CardTitle>
                </div>
                <CardDescription>
                  Practice with mock interviews and get expert feedback on your performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Start Practice
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Search className="h-6 w-6 text-primary" />
                  <CardTitle>Job Search Guidance</CardTitle>
                </div>
                <CardDescription>
                  Learn effective job search strategies and connect with opportunities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Explore Jobs
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <CardTitle>Higher Education</CardTitle>
                </div>
                <CardDescription>
                  Get guidance on pursuing master&apos;s, PhD, or other advanced degrees.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <CardTitle>Book a Session</CardTitle>
                </div>
                <CardDescription>
                  Schedule one-on-one counselling sessions with our expert career advisors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/book-session">
                  <Button variant="outline" className="w-full">
                    Book Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-6">
                Why Choose NIT Career Counselling?
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                With years of experience in the industry and academia, our team of NIT alumni
                understands the unique challenges and opportunities that NIT graduates face.
                We provide personalized guidance to help you navigate your career path.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  Expert counsellors with industry experience
                </li>
                <li className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  Personalized career planning
                </li>
                <li className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  Access to exclusive job opportunities
                </li>
                <li className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  Continuous support throughout your career
                </li>
              </ul>
              <Button size="lg">
                Contact Us
              </Button>
            </div>
            <div className="bg-muted rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-2xl font-semibold mb-2">Success Stories</h3>
              <p className="text-muted-foreground">
                Join thousands of NIT graduates who have transformed their careers with our guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Take the first step towards a successful career. Book your free consultation today.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8">
            Book Free Consultation
          </Button>
        </div>
      </section>
    </div>
  );
}
