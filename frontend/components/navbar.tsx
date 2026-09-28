"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#faqs", label: "FAQs" },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === "/"

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close the menu on navigation and lock page scroll while it's open
  useEffect(() => setIsMenuOpen(false), [pathname])
  useEffect(() => {
    if (!isMenuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [isMenuOpen])

  const isTransparent = isHome && !isScrolled && !isMenuOpen

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full pt-[env(safe-area-inset-top)] transition-colors duration-300",
        isTransparent ? "bg-transparent" : "bg-background/95 shadow-sm backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 lg:h-[72px] lg:px-6">
        <Link href="/" className="flex min-w-0 items-center" aria-label="iLOcate home">
          <Image
            src={isTransparent ? "/Ilocate No BG.svg" : "/logo black line.svg"}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <span className={cn("text-xl font-bold tracking-tight md:text-2xl", isTransparent ? "text-white" : "text-foreground")}>
            iLO<span className={isTransparent ? "text-brand" : "text-primary"}>cate</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors",
                isTransparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild>
            <Link href="/dashboard">Explore</Link>
          </Button>
        </div>

        <button
          type="button"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-colors md:hidden",
            isTransparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted",
          )}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top))] z-40 flex flex-col bg-background px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2 md:hidden"
        >
          <nav className="flex flex-col" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-14 items-center border-b border-border text-lg font-semibold text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                Explore Iloilo
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
