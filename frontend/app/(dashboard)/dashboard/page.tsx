"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { BookmarkCheck, ChevronRight, CircleHelp, Languages, Map, Maximize2, Search } from "lucide-react"
import { landmarks } from "@ilocate/backend/landmarks"
import { loadAndDecodeRoutes, type DecodedRoute } from "@ilocate/backend/routes"
import { PlaceCard, type PlaceSummary } from "@/components/place-card"
import { PlaceSheet } from "@/components/place-sheet"
import { likedItemFromPlace, useLikedItems } from "@/lib/likes"
import { getUserPreferences } from "@/lib/preferences"
import { getPlaceImage, getRating, isFoodType } from "@/lib/places"

const MapComponent = dynamic(() => import("@/components/map-leaflet"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
})

const MAP_CENTER: [number, number] = [10.6969, 122.5644]
const MAP_ZOOM = 13

const quickActions = [
  { href: "/dashboard/map", label: "Routes", icon: Map, tint: "bg-primary/10 text-primary" },
  { href: "/dashboard/translator", label: "Translate", icon: Languages, tint: "bg-sky-100 text-sky-700" },
  { href: "/dashboard/saved-routes", label: "Saved", icon: BookmarkCheck, tint: "bg-rose-100 text-rose-700" },
  { href: "/dashboard/help", label: "Help", icon: CircleHelp, tint: "bg-amber-100 text-amber-700" },
]

const exploreCategories = [
  { name: "Malls", image: "/images/places/Malls/sm city iloilo.jpg", href: "/dashboard/places?category=malls" },
  { name: "Churches", image: "/images/places/Churches/miagao-church.jpg", href: "/dashboard/places?category=churches" },
  { name: "Museums", image: "/images/places/Museums/ilomoca museum.webp", href: "/dashboard/places?category=museum" },
  { name: "Landmarks", image: "/images/places/Attractions/esplanade.jpg", href: "/dashboard/places?category=city-landmark-attraction" },
  { name: "Beaches", image: "/images/places/Beach/sea garden.jpg", href: "/dashboard/places?category=beaches" },
  { name: "Local Food", image: "/images/food/Local Food/alicia's lapaz food.jpg", href: "/dashboard/food?category=local-food" },
  { name: "Cafes", image: "/images/food/Cafes/madge lapaz cafe.jpg", href: "/dashboard/food?category=cafes" },
  { name: "Restaurants", image: "/images/food/Restaurant/tytche food.jpg", href: "/dashboard/food?category=restaurants" },
]

const preferenceToLandmarkTypes: Record<string, string[]> = {
  "coffee-shops": ["Cafe"],
  restaurants: ["Food"],
  churches: ["Church"],
  museums: ["Museum"],
  "city-landmarks": ["Urban", "Heritage"],
  beaches: ["Beach"],
  malls: ["Mall"],
}

// Stable pseudo-shuffle so recommendations don't reorder on every render
function orderByStableHash<T extends { name: string; type: string }>(items: T[]) {
  const hash = (value: string) => {
    let result = 2166136261
    for (let i = 0; i < value.length; i++) {
      result ^= value.charCodeAt(i)
      result += (result << 1) + (result << 4) + (result << 7) + (result << 8) + (result << 24)
    }
    return result >>> 0
  }
  return [...items].sort((a, b) => hash(`${a.name}|${a.type}`) - hash(`${b.name}|${b.type}`) || a.name.localeCompare(b.name))
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 4) return "Maayong gab-i"
  if (hour < 12) return "Maayong aga"
  if (hour < 18) return "Maayong hapon"
  return "Maayong gab-i"
}

function SectionHeader({ title, href, linkLabel = "See all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {href && (
        <Link href={href} className="flex min-h-10 items-center gap-0.5 text-sm font-medium text-primary">
          {linkLabel} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { isLiked, toggleLike } = useLikedItems()
  const [preferences, setPreferences] = useState<string[]>([])
  const [previewRoutes, setPreviewRoutes] = useState<DecodedRoute[]>([])
  const [selected, setSelected] = useState<PlaceSummary | null>(null)
  const [hello, setHello] = useState("Maayong adlaw")

  useEffect(() => setHello(greeting()), [])

  useEffect(() => {
    setPreferences(getUserPreferences())
  }, [])

  useEffect(() => {
    let isMounted = true
    loadAndDecodeRoutes()
      .then((decoded) => isMounted && setPreviewRoutes(decoded))
      .catch(() => isMounted && setPreviewRoutes([]))
    return () => {
      isMounted = false
    }
  }, [])

  const recommended = useMemo<PlaceSummary[]>(() => {
    const selectedTypes = new Set(preferences.flatMap((pref) => preferenceToLandmarkTypes[pref] ?? []))
    const preferred = landmarks.filter((landmark) => selectedTypes.has(landmark.type))
    const source = preferred.length > 0 ? preferred : orderByStableHash(landmarks)
    return source.slice(0, 12).map((landmark) => ({
      name: landmark.name,
      image: getPlaceImage(landmark.type, landmark.imageUrl),
      category: landmark.type,
      rating: getRating(landmark.type),
      kind: isFoodType(landmark.type) ? "Food" : "Place",
    }))
  }, [preferences])

  const likePlace = (place: PlaceSummary) => toggleLike(likedItemFromPlace(place))

  const firstName = "Explorer"
  const foodCount = landmarks.filter((l) => isFoodType(l.type)).length

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-5 lg:px-6 lg:pt-8">
      {/* Greeting + search */}
      <section className="mb-5">
        <p className="text-sm text-muted-foreground">{hello},</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{firstName} 👋</h1>
        <Link
          href="/dashboard/map"
          className="mt-4 flex h-12 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 text-left shadow-sm transition-colors hover:border-primary/50 md:max-w-xl"
        >
          <Search className="h-5 w-5 text-primary" />
          <span className="text-base text-muted-foreground">Where do you want to go?</span>
        </Link>
      </section>

      {/* Quick actions */}
      <nav aria-label="Tools" className="mb-6 grid grid-cols-4 gap-2 md:max-w-xl">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-1.5 rounded-2xl p-2 text-center transition-colors hover:bg-card"
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.tint}`}>
              <action.icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
          </Link>
        ))}
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="min-w-0">
          {/* Map preview */}
          <section className="mb-8">
            <div className="map-static relative h-52 overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-sm md:h-72">
              <MapComponent
                center={MAP_CENTER}
                zoom={MAP_ZOOM}
                routes={[]}
                showAllRoutes
                decodedRoutes={previewRoutes}
                landmarks={[]}
                selectedRoute={null}
                showLandmarks={false}
                showCenterMarker={false}
                showCurrentLocation={false}
                showLocateControl={false}
                requireClickToZoom
              />
              {/* Tapping anywhere opens the full map instead of fighting page scroll */}
              <Link href="/dashboard/map" className="absolute inset-0 z-10" aria-label="Open the full map" />
              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex items-end justify-between gap-2">
                <div className="rounded-2xl bg-background/95 px-3 py-2 shadow-md backdrop-blur-sm">
                  <p className="text-sm font-semibold text-foreground">Jeepney routes near you</p>
                  <p className="text-xs text-muted-foreground">
                    {previewRoutes.length > 0 ? `${previewRoutes.length} routes` : "Loading routes…"} · {landmarks.length} spots
                  </p>
                </div>
                <span className="flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md">
                  <Maximize2 className="h-4 w-4" /> Open
                </span>
              </div>
            </div>
          </section>

          {/* Recommended */}
          <section className="mb-8">
            <SectionHeader title={preferences.length ? "Picked for you" : "Popular in Iloilo"} href="/dashboard/places" />
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
              {recommended.map((place, index) => (
                <PlaceCard
                  key={`${place.name}-${index}`}
                  place={place}
                  liked={isLiked(place.name)}
                  onSelect={() => setSelected(place)}
                  onToggleLike={() => likePlace(place)}
                  className="w-[44vw] max-w-[220px] shrink-0 snap-start lg:w-auto lg:max-w-none"
                />
              ))}
            </div>
          </section>
        </div>

        {/* Categories */}
        <section className="mb-8">
          <SectionHeader title="Explore by category" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {exploreCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group relative flex h-24 items-end overflow-hidden rounded-2xl bg-muted p-3"
              >
                <Image
                  src={category.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="relative text-sm font-semibold text-white">{category.name}</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{foodCount} food spots and counting.</p>
        </section>
      </div>

      <PlaceSheet
        place={selected}
        liked={selected ? isLiked(selected.name) : false}
        onToggleLike={selected ? () => likePlace(selected) : undefined}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
