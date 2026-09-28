"use client"

import Image from "next/image"
import { Heart, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export type PlaceSummary = {
  name: string
  image: string
  category: string
  rating: number
  /** "Food" cards get the gold badge, places get teal */
  kind: "Place" | "Food"
}

export function PlaceCard({
  place,
  liked,
  onSelect,
  onToggleLike,
  className,
  imageClassName = "aspect-[4/3]",
}: {
  place: PlaceSummary
  liked?: boolean
  onSelect: () => void
  /** Omit to hide the heart button */
  onToggleLike?: () => void
  className?: string
  imageClassName?: string
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(16,40,40,0.04)] transition-shadow hover:shadow-md",
        className,
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`View ${place.name}`}
      >
        <div className={cn("relative w-full overflow-hidden bg-muted", imageClassName)}>
          <Image
            src={place.image}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <span
            className={cn(
              "absolute left-2 top-2 max-w-[calc(100%-3.5rem)] truncate rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm",
              place.kind === "Food" ? "bg-accent/95 text-accent-foreground" : "bg-primary/95 text-primary-foreground",
            )}
          >
            {place.category}
          </span>
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{place.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
            {place.rating.toFixed(1)}
            <span aria-hidden>·</span>
            Iloilo
          </p>
        </div>
      </button>
      {onToggleLike && (
        <button
          type="button"
          onClick={onToggleLike}
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center"
          aria-label={liked ? `Unlike ${place.name}` : `Like ${place.name}`}
          aria-pressed={liked}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors group-hover:bg-black/55">
            <Heart className={cn("h-4 w-4", liked ? "fill-red-500 text-red-500" : "text-white")} />
          </span>
        </button>
      )}
    </article>
  )
}
