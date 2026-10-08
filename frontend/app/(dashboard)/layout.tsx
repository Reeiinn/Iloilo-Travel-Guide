"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  BookmarkCheck,
  Building2,
  CircleHelp,
  Home,
  Languages,
  LogIn,
  LogOut,
  Map,
  User,
  UserPlus,
  Utensils,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Desktop top navigation
const desktopLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/map", label: "Map", icon: Map },
  { href: "/dashboard/places", label: "Places", icon: Building2 },
  { href: "/dashboard/food", label: "Food", icon: Utensils },
  { href: "/dashboard/translator", label: "Translator", icon: Languages },
  { href: "/dashboard/saved-routes", label: "Saved", icon: BookmarkCheck },
]

// Phone/tablet bottom tab bar (the other tools live on Home and Profile)
const tabLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/map", label: "Map", icon: Map },
  { href: "/dashboard/places", label: "Places", icon: Building2 },
  { href: "/dashboard/food", label: "Food", icon: Utensils },
  { href: "/dashboard/profile", label: "Profile", icon: User },
]

// Secondary tools reachable from the avatar menu
const toolLinks = [
  { href: "/dashboard/translator", label: "Translator", icon: Languages },
  { href: "/dashboard/saved-routes", label: "Saved routes", icon: BookmarkCheck },
]

function UserMenu() {
  const { user, logOut } = useAuth()
  const router = useRouter()
  const displayName = user?.name ?? "Guest explorer"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-11 w-11 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={user ? `Account menu for ${user.name}` : "Account menu"}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {user ? displayName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-semibold">{displayName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user ? user.email : "Browsing as guest"}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!user && (
          <>
            <DropdownMenuItem asChild className="min-h-10">
              <Link href="/login">
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-10">
              <Link href="/signup">
                <UserPlus className="h-4 w-4" /> Create account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild className="min-h-10">
          <Link href="/dashboard/profile">
            <User className="h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        {toolLinks.map((link) => (
          <DropdownMenuItem key={link.href} asChild className="min-h-10 lg:hidden">
            <Link href={link.href}>
              <link.icon className="h-4 w-4" /> {link.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild className="min-h-10">
          <Link href="/dashboard/help">
            <CircleHelp className="h-4 w-4" /> Help & FAQs
          </Link>
        </DropdownMenuItem>
        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="min-h-10 text-destructive focus:text-destructive"
              onSelect={() => {
                logOut()
                router.push("/dashboard")
              }}
            >
              <LogOut className="h-4 w-4 text-destructive" /> Log out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // The map is full-screen on phones; it draws its own floating controls instead of the header
  const isMapPage = pathname === "/dashboard/map"

  return (
    <div className="flex min-h-dvh flex-col bg-secondary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-border/70 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md",
          isMapPage && "hidden lg:block",
        )}
      >
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 lg:h-16 lg:px-6">
          <Link href="/dashboard" className="flex min-w-0 items-center" aria-label="iLOcate home">
            <Image src="/logo black line.svg" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              iLO<span className="text-primary">cate</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {desktopLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <UserMenu />
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className={cn("flex-1 focus:outline-none", isMapPage ? "pb-0" : "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0")}>
        {children}
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-safe backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
          {tabLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                      isActive && "bg-primary/10",
                    )}
                  >
                    <link.icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
