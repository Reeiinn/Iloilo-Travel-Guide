"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Bus, Check, Languages, Loader2, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { INTEREST_CATEGORIES } from "@/lib/interests"
import { markOnboardingComplete, saveUserPreferences } from "@/lib/preferences"
import { cn } from "@/lib/utils"

const highlights = [
  { label: "Jeepney routes", icon: Bus },
  { label: "Places & food", icon: UtensilsCrossed },
  { label: "Ilonggo phrases", icon: Languages },
]

const collage = [
  "/images/places/Churches/miagao-church.jpg",
  "/images/food/Local Food/alicia's lapaz food.jpg",
  "/images/places/Attractions/esplanade.jpg",
]

export default function WelcomePage() {
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const allSelected = selected.length === INTEREST_CATEGORIES.length

  const toggleCategory = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  const finish = (preferences?: string[]) => {
    setLoading(true)
    if (preferences) saveUserPreferences(preferences)
    markOnboardingComplete()
    router.replace("/dashboard")
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto pb-6">
        {/* Photo collage header */}
        <div className="relative h-56 overflow-hidden rounded-b-[2rem] bg-muted">
          <div className="absolute inset-0 grid grid-cols-3 gap-1">
            {collage.map((src) => (
              <div key={src} className="relative">
                <Image src={src} alt="" fill priority className="object-cover" sizes="(max-width: 448px) 33vw, 150px" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/85" />
          <div className="absolute inset-x-0 bottom-0 p-5 pt-[env(safe-area-inset-top)]">
            <div className="mb-2 flex items-center">
              <Image src="/Ilocate No BG.svg" alt="" width={40} height={40} className="-ml-1 h-10 w-10 object-contain" />
              <span className="text-xl font-bold tracking-tight text-white">
                iLO<span className="text-brand">cate</span>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white">
              Maayong pag-abot! <span className="block text-brand">Explore Iloilo like a local.</span>
            </h1>
          </div>
        </div>

        <div className="px-5">
          <ul className="mt-4 grid grid-cols-3 gap-2">
            {highlights.map((item) => (
              <li
                key={item.label}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-secondary px-2 py-3 text-center text-xs font-medium text-foreground"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-4 w-4" />
                </span>
                {item.label}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground">What are you into?</h2>
            <button
              type="button"
              onClick={() => setSelected(allSelected ? [] : INTEREST_CATEGORIES.map((cat) => cat.id))}
              className="min-h-10 shrink-0 text-sm font-medium text-primary"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Pick a few and we&apos;ll tailor your Home feed.</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {INTEREST_CATEGORIES.map((cat) => {
              const isSelected = selected.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "flex min-h-14 items-center gap-2.5 rounded-2xl border-2 px-3 text-left text-sm font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isSelected ? <Check className="h-4 w-4" /> : <cat.icon className="h-4 w-4" />}
                  </span>
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 border-t border-border/70 bg-background/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <Button
          onClick={() => finish(selected)}
          disabled={loading}
          size="lg"
          className="h-12 w-full rounded-2xl text-base font-semibold"
        >
          {loading && <Loader2 className="animate-spin" />}
          {selected.length > 0 ? `Get started · ${selected.length} selected` : "Get started"}
        </Button>
        <button
          type="button"
          onClick={() => finish()}
          disabled={loading}
          className="mt-1 flex min-h-11 w-full items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
        <p className="text-center text-xs text-muted-foreground">You can change these anytime in Profile.</p>
      </div>
    </>
  )
}
