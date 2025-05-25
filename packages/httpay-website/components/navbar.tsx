"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { APP_NAME } from "@/lib/constants"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { ConnectButton } from "@/components/wallet/connect-button"

// Removed "Home" from navItems
const navItems = [
  { name: "Problem", href: "/#problem" },
  { name: "Solution", href: "/#solution" },
  { name: "Demo", href: "/#demo" },
  { name: "Vision", href: "/#vision" },
]

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("hero")
  const [isScrolled, setIsScrolled] = useState(false)

  // Track scroll position to update active section and navbar style
  useEffect(() => {
    const handleScroll = () => {
      // Update navbar style based on scroll position
      setIsScrolled(window.scrollY > 10)

      // Find the current active section
      const sections = ["hero", ...navItems.map((item) => item.href.substring(1))]

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        isScrolled ? "bg-background/80 backdrop-blur-sm border-b" : "bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Styled title to show in purple when on hero section */}
          <Link
            href="/#hero"
            className={cn(
              "flex items-center space-x-2 font-bold text-xl transition-colors",
              activeSection === "hero" ? "text-primary" : ""
            )}
          >
            {APP_NAME}
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm transition-colors hover:text-primary",
                  activeSection === item.href.substring(1) ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />

          <div className="hidden md:flex">
            <ConnectButton />
          </div>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b pb-4">
                  <Link href="#hero" className="font-bold text-xl">
                    {APP_NAME}
                  </Link>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </SheetTrigger>
                </div>
                <nav className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <SheetTrigger key={item.name} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "text-lg py-2 transition-colors hover:text-primary",
                          activeSection === item.href.substring(1)
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.name}
                      </Link>
                    </SheetTrigger>
                  ))}
                </nav>
                <div className="mt-auto pb-8">
                  <ConnectButton />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
