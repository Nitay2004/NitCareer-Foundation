"use client";

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useState } from "react"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          {/* <GraduationCap className="h-6 w-6" /> */}
          <span className="font-bold text-xl tracking-tight">NIT Career Foundation</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          <NavLink href="#services">Services</NavLink>
          <NavLink href="#about">About</NavLink>
          <NavLink href="#contact">Contact</NavLink>
          <SignedIn>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/admin">Admin</NavLink>
          </SignedIn>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-4">
            <SignedOut>
              <SignInButton>
                <Button variant="outline" size="sm" className="rounded-full px-5">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <div className="h-4 w-px bg-border mx-2" />
            <ModeToggle />
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full h-10 w-10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-background/98 backdrop-blur-xl p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col space-y-4">
            <MobileNavLink href="#services" onClick={() => setIsMobileMenuOpen(false)}>Services</MobileNavLink>
            <MobileNavLink href="#about" onClick={() => setIsMobileMenuOpen(false)}>About</MobileNavLink>
            <MobileNavLink href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</MobileNavLink>
            <SignedIn>
              <MobileNavLink href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</MobileNavLink>
              <MobileNavLink href="/admin" onClick={() => setIsMobileMenuOpen(false)}>Admin</MobileNavLink>
            </SignedIn>
          </nav>
          <div className="flex flex-col pt-6 border-t gap-5">
            <SignedOut>
              <SignInButton>
                <Button className="w-full h-11 rounded-lg font-bold">Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center justify-between w-full px-2">
                <span className="text-sm font-semibold text-muted-foreground">My Account</span>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <div className="flex items-center justify-between w-full px-2">
              <span className="text-sm font-semibold text-muted-foreground">Dark mode</span>
              <ModeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium title-case hover:text-primary transition-colors">
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children, onClick }: { href: string, children: React.ReactNode, onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-lg font-bold hover:text-primary transition-colors py-2"
    >
      {children}
    </Link>
  )
}