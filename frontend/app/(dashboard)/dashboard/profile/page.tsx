"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookmarkCheck,
  Check,
  ChevronRight,
  Church,
  CircleHelp,
  Coffee,
  Heart,
  Landmark,
  Languages,
  Loader2,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from "lucide-react"
import { getUserPreferences, saveUserPreferences } from "@/lib/preferences"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PlaceCard, type PlaceSummary } from "@/components/place-card"
import { PlaceSheet } from "@/components/place-sheet"
import { useLikedItems, type LikedItem } from "@/lib/likes"
import { cn } from "@/lib/utils"

const tools = [
  { href: "/dashboard/translator", label: "Translator", description: "English ↔ Ilonggo phrases", icon: Languages },
  { href: "/dashboard/saved-routes", label: "Saved routes", description: "Trips you bookmarked", icon: BookmarkCheck },
  { href: "/dashboard/help", label: "Help & FAQs", description: "How iLOcate works, and the team behind it", icon: CircleHelp },
]

function toSummary(item: LikedItem): PlaceSummary {
  return {
    name: item.name,
    image: item.image,
    category: item.label || item.category,
    rating: item.rating ?? 4.5,
    kind: item.category,
  }
}

function Section({ title, icon: Icon, children, action }: { title: string; icon: typeof Heart; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function ProfilePage() {
  const { likedItems, toggleLike, clearLikes } = useLikedItems()
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const [savedPreferences, setSavedPreferences] = useState<string[]>([])
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [selected, setSelected] = useState<LikedItem | null>(null)
  const [confirmLogOut, setConfirmLogOut] = useState(false)
  const { user, ready: authReady, logOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const preferences = getUserPreferences()
    setSelectedPreferences(preferences)
    setSavedPreferences(preferences)
    setLoadingPreferences(false)
  }, [])

  const togglePreference = (id: string) =>
    setSelectedPreferences((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))

  const preferencesChanged =
    selectedPreferences.length !== savedPreferences.length ||
    selectedPreferences.some((pref) => !savedPreferences.includes(pref))

  // Saving is a synchronous localStorage write that never throws, so no pending state is needed
  const handleSavePreferences = () => {
    saveUserPreferences(selectedPreferences)
    setSavedPreferences(selectedPreferences)
  }

  const userName = user?.name ?? "Guest explorer"
  const selectedSummary = selected ? toSummary(selected) : null

  const handleLogOut = () => {
    logOut()
    setConfirmLogOut(false)
    router.push("/dashboard")
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-8 pt-5 lg:pt-8">
      {/* Identity */}
      <section className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-primary to-[#0E6F79] p-5 text-primary-foreground shadow-sm">
        <Avatar className="h-16 w-16 border-2 border-white/40">
          <AvatarFallback className="bg-white/20 text-xl font-bold text-white">
            {user ? userName.charAt(0).toUpperCase() : <UserRound className="h-7 w-7" />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{authReady ? userName : " "}</h1>
          <p className="truncate text-sm text-white/80">
            {user ? user.email : "Sign in to keep your likes under your own profile"}
          </p>
          <div className="mt-2 flex gap-4 text-sm">
            <span>
              <strong className="font-bold">{likedItems.length}</strong> <span className="text-white/80">liked</span>
            </span>
            <span>
              <strong className="font-bold">{savedPreferences.length}</strong> <span className="text-white/80">interests</span>
            </span>
          </div>
        </div>
      </section>

      {authReady && !user && (
        <section className="rounded-3xl bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-foreground">You&apos;re browsing as a guest</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create an account or sign in to get your own profile.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
            <Button asChild>
              <Link href="/signup?next=/dashboard/profile">
                <UserPlus /> Create account
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login?next=/dashboard/profile">
                <LogIn /> Sign in
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Tools (not in the phone tab bar) */}
      <nav aria-label="Tools" className="overflow-hidden rounded-3xl bg-card shadow-sm">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="flex min-h-16 items-center gap-3 border-b border-border/60 px-4 transition-colors last:border-b-0 hover:bg-muted/60"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <tool.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{tool.label}</span>
              <span className="block text-xs text-muted-foreground">{tool.description}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </nav>

      <Section title="Your interests" icon={Sparkles}>
        {loadingPreferences ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your interests…
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">We use these to pick recommendations for you.</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_CATEGORIES.map((category) => {
                const isSelected = selectedPreferences.includes(category.id)
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => togglePreference(category.id)}
                    className={cn(
                      "flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {isSelected ? <Check className="h-4 w-4" /> : <category.icon className="h-4 w-4" />}
                    {category.label}
                  </button>
                )
              })}
            </div>
            {preferencesChanged && (
              <Button onClick={handleSavePreferences} className="mt-4 w-full sm:w-auto">
                Save interests
              </Button>
            )}
          </>
        )}
      </Section>

      <Section
        title="Liked places & food"
        icon={Heart}
        action={
          likedItems.length > 0 && (
            <button
              type="button"
              onClick={() => window.confirm(`Remove all ${likedItems.length} liked places?`) && clearLikes()}
              className="min-h-10 text-sm font-medium text-muted-foreground hover:text-destructive"
            >
              Clear all
            </button>
          )
        }
      >
        {likedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
            <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Tap the heart on any place to save it here.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard/places">Browse places</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {likedItems.map((item) => (
              <PlaceCard
                key={item.id}
                place={toSummary(item)}
                liked
                onSelect={() => setSelected(item)}
                onToggleLike={() => toggleLike(item)}
              />
            ))}
          </div>
        )}
      </Section>

      {user && (
        <section className="rounded-3xl bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-foreground">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
          <Button
            variant="outline"
            onClick={() => setConfirmLogOut(true)}
            className="mt-4 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
          >
            <LogOut /> Log out
          </Button>
        </section>
      )}

      <Dialog open={confirmLogOut} onOpenChange={setConfirmLogOut}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log out of iLOcate?</DialogTitle>
            <DialogDescription>You can keep browsing as a guest and sign back in anytime.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmLogOut(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogOut}>
              <LogOut /> Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PlaceSheet
        place={selectedSummary}
        liked={true}
        onToggleLike={
          selected
            ? () => {
                toggleLike(selected)
                setSelected(null)
              }
            : undefined
        }
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
