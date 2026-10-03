"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Clock, Heart, MapPin, Navigation, Share2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { directionsHref } from "@/lib/places"
import { cn } from "@/lib/utils"
import type { PlaceSummary } from "@/components/place-card"

/**
 * Place details with a "Get directions" action.
 * Slides up from the bottom on phones and shows as a centered dialog on larger screens.
 */
export function PlaceSheet({
  place,
  liked,
  onToggleLike,
  onClose,
}: {
  place: PlaceSummary | null
  liked?: boolean
  onToggleLike?: () => void
  onClose: () => void
}) {
  const router = useRouter()

  const share = async (name: string) => {
    const url = new URL(directionsHref(name), window.location.origin).toString()
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `${name} · iLOcate`, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      // The user closed the share sheet, or clipboard access was blocked
    }
  }

  return (
    <Dialog open={place !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "gap-0 overflow-hidden border-0 p-0",
          // Phone: bottom sheet
          "bottom-0 left-0 top-auto max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-b-none rounded-t-3xl",
          "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
          // Tablet and up: centered dialog
          "sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-3xl",
          "sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95",
        )}
      >
        {place && (
          <div className="flex max-h-[90dvh] flex-col overflow-y-auto">
            <div className="relative aspect-[16/10] w-full shrink-0 bg-muted">
              <Image src={place.image} alt={place.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 448px" />
              <div className="absolute inset-x-0 top-0 flex justify-center pt-2 sm:hidden" aria-hidden>
                <span className="h-1.5 w-10 rounded-full bg-white/80" />
              </div>
            </div>

            <div className="flex flex-col gap-4 p-5 pb-safe">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                      place.kind === "Food" ? "bg-accent/20 text-foreground" : "bg-primary/10 text-primary",
                    )}
                  >
                    {place.category}
                  </span>
                  <DialogTitle className="mt-2 text-xl font-bold leading-tight text-foreground">{place.name}</DialogTitle>
                  <DialogDescription className="mt-1 flex items-center gap-1 text-sm">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> Iloilo City
                  </DialogDescription>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => share(place.name)}
                    aria-label={`Share ${place.name}`}
                    className="rounded-full"
                  >
                    <Share2 className="text-muted-foreground" />
                  </Button>
                  {onToggleLike && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onToggleLike}
                      aria-label={liked ? `Unlike ${place.name}` : `Like ${place.name}`}
                      aria-pressed={liked}
                      className="rounded-full"
                    >
                      <Heart className={cn(liked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                    </Button>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-secondary p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden /> Est. commute
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">~15–25 min</dd>
                </div>
                <div className="rounded-2xl bg-secondary p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5" aria-hidden /> Est. fare
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">PHP 10–30</dd>
                </div>
              </dl>

              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    const href = directionsHref(place.name)
                    onClose()
                    router.push(href)
                  }}
                >
                  <Navigation /> Get directions
                </Button>
                <Button size="lg" variant="outline" className="flex-1" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
