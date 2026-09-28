"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Coffee, UtensilsCrossed, Waves, Landmark, Church, ShoppingBag, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveUserPreferences } from "@/lib/preferences"

const categories = [
  { id: "coffee-shops", label: "Coffee Shops", icon: Coffee },
  { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { id: "beaches", label: "Beaches", icon: Waves },
  { id: "churches", label: "Churches", icon: Church },
  { id: "malls", label: "Malls", icon: ShoppingBag },
  { id: "city-landmarks", label: "City Landmarks & Attractions", icon: Landmark },
  { id: "museums", label: "Museums", icon: Landmark },
]

export default function PreferencesPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggleCategory = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleContinue = async () => {
    setLoading(true)
    try {
      saveUserPreferences(selected)
      router.push("/dashboard")
    } catch (error) {
      // Still proceed to dashboard even if saving fails
      console.error("Error saving preferences:", error)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push("/dashboard")
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-2">
      <div className="mb-2">
        <Link href="/dashboard" className="flex items-center gap-0">
          <Image
            src="/logo black line.svg"
            alt="iLOcate logo"
            width={50}
            height={50}
            className="h-7 w-7 object-contain"
          />
          <span className="text-xl font-semibold text-primary">iLOcate</span>
        </Link>
      </div>

      <h1 className="mt-1 text-2xl font-bold text-foreground">What are your likings?</h1>
      <p className="mt-1 max-w-xl text-sm leading-normal text-muted-foreground">
        Select the categories that interest you. We will personalize your experience based on your preferences.
      </p>

      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        {categories.map((cat) => {
          const isSelected = selected.includes(cat.id)
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                isSelected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                isSelected ? "border-primary bg-primary" : "border-muted-foreground/40 bg-background"
              }`}>
                {isSelected && (
                  <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <Icon className={`h-5 w-5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-border/70 pt-2 sm:flex-row">
        {selected.length > 0 && (
          <Button
            onClick={handleContinue}
            disabled={loading}
            className="min-h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-1"
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Continue"}
          </Button>
        )}
        <Button
          onClick={handleSkip}
          variant="outline"
          className="min-h-11 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-muted sm:flex-1"
        >
          Skip
        </Button>
      </div>

      <p className="mt-2 text-center text-sm text-muted-foreground">
        You can always change your preferences later in your profile.
      </p>
    </div>
  )
}
