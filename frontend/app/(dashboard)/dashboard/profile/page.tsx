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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PlaceCard, type PlaceSummary } from "@/components/place-card"
import { PlaceSheet } from "@/components/place-sheet"
import { useLikedItems, type LikedItem } from "@/lib/likes"
import { cn } from "@/lib/utils"

const PREFERENCE_CATEGORIES = [
  { id: "coffee-shops", label: "Coffee Shops", icon: Coffee },
  { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { id: "beaches", label: "Beaches", icon: Waves },
  { id: "churches", label: "Churches", icon: Church },
  { id: "malls", label: "Malls", icon: ShoppingBag },
  { id: "city-landmarks", label: "Landmarks", icon: Landmark },
  { id: "museums", label: "Museums", icon: Landmark },
] as const

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
  const { likedItems, toggleLike } = useLikedItems()
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const [savedPreferences, setSavedPreferences] = useState<string[]>([])
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [selected, setSelected] = useState<LikedItem | null>(null)

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

  const handleSavePreferences = async () => {
    setSavingPreferences(true)
    try {
      saveUserPreferences(selectedPreferences)
      setSavedPreferences(selectedPreferences)
    } catch (error) {
      console.error("Error saving preferences:", error)
    } finally {
      setSavingPreferences(false)
    }
  }

  const userName = "iLOcate Explorer"
  const selectedSummary = selected ? toSummary(selected) : null

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-8 pt-5 lg:pt-8">
      {/* Identity */}
      <section className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-primary to-[#0E6F79] p-5 text-primary-foreground shadow-sm">
        <Avatar className="h-16 w-16 border-2 border-white/40">
          <AvatarFallback className="bg-white/20 text-xl font-bold text-white">{userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{userName}</h1>
          <p className="truncate text-sm text-white/80">Your interests and likes are saved on this device</p>
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
              {PREFERENCE_CATEGORIES.map((category) => {
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
              <Button onClick={handleSavePreferences} disabled={savingPreferences} className="mt-4 w-full sm:w-auto">
                {savingPreferences && <Loader2 className="animate-spin" />}
                {savingPreferences ? "Saving…" : "Save interests"}
              </Button>
            )}
          </>
        )}
      </Section>

      <Section title="Liked places & food" icon={Heart}>
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
