"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Bus, Loader2, Map, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { landmarks } from "@ilocate/backend/landmarks"
import { loadAndDecodeRoutes, type DecodedRoute } from "@ilocate/backend/routes"
import { getPlaceImage, getRating } from "@/lib/places"
import { cn } from "@/lib/utils"

const MapLeaflet = dynamic(() => import("@/components/map-leaflet"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
})

// A mix of churches, food, cafes and heritage spots (round-robin) for the guest preview
function pickSuggestions(max: number) {
  const groups = ["Church", "Food", "Cafe", "Heritage"].map((type) => landmarks.filter((l) => l.type === type))
  const picks: typeof landmarks = []
  for (let i = 0; picks.length < max && groups.some((group) => group[i]); i++) {
    for (const group of groups) if (group[i] && picks.length < max) picks.push(group[i])
  }
  return picks
}

const suggestions = pickSuggestions(8).map((l) => ({
  name: l.name,
  image: getPlaceImage(l.type, l.imageUrl),
  rating: getRating(l.type),
  type: l.type,
}))

function DestinationCard({ name, image, rating, type, className }: (typeof suggestions)[number] & { className?: string }) {
  return (
    <Link
      href="/dashboard/places"
      aria-label={`Explore ${name}`}
      className={cn("group relative block shrink-0 overflow-hidden rounded-2xl", className)}
    >
      <Image
        src={image}
        alt=""
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110"
        sizes="260px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="text-xs font-medium text-white/70">{type}</p>
        <h3 className="line-clamp-2 text-sm font-semibold text-white">{name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden /> {rating}
        </p>
      </div>
    </Link>
  )
}

export function HeroSection() {
  const [showMapModal, setShowMapModal] = useState(false)
  const [routes, setRoutes] = useState<DecodedRoute[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const routeItemRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    loadAndDecodeRoutes()
      .then((decoded) => {
        const routeNumber = (route: DecodedRoute) => Number.parseInt(route.routeNumber.replace(/[^0-9]/g, ""), 10)
        setRoutes(
          [...decoded].sort((a, b) => routeNumber(a) - routeNumber(b) || a.routeNumber.localeCompare(b.routeNumber)),
        )
      })
      .catch((error) => {
        console.error("Error loading PUJ routes:", error)
        setRoutes([])
      })
      .finally(() => setLoadingRoutes(false))
  }, [])

  // Lock page scroll and allow Esc to close while the routes modal is open
  useEffect(() => {
    if (!showMapModal) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeModal()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [showMapModal])

  useEffect(() => {
    if (!selectedRouteId) return
    routeItemRefs.current[selectedRouteId]?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedRouteId])

  const closeModal = () => {
    setShowMapModal(false)
    setSelectedRouteId(null)
  }

  const stats = [
    { value: "20+", label: "Jeepney routes" },
    { value: "50+", label: "Places" },
    { value: "40+", label: "Food spots" },
  ]

  return (
    <>
      <section className="relative -mt-[calc(4rem+env(safe-area-inset-top))] overflow-hidden bg-[#0B2426] lg:-mt-[calc(72px+env(safe-area-inset-top))]">
        <Image
          src="/images/banners/hero-iloilo(1).svg"
          alt=""
          fill
          priority
          // The SVG pads its photo with empty space; scale it up so the photo fills the hero
          className="scale-[1.4] object-cover opacity-70"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0B2426]" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-[1200px] flex-col justify-end gap-8 px-4 pb-10 pt-[calc(6rem+env(safe-area-inset-top))] lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:pb-16">
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden /> Your guide to Iloilo City
            </p>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Explore Iloilo <span className="text-brand">like a local.</span>
            </h1>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-white/75 lg:text-lg">
              Find the right jeepney, get directions, and discover places and food worth the trip, all from your phone.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="text-base">
                <Link href="/dashboard">
                  Explore Iloilo <ArrowRight />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowMapModal(true)}
                className="border-white/25 bg-white/10 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <Map /> View jeepney routes
              </Button>
            </div>

            <dl className="mt-8 grid max-w-sm grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-2xl font-bold text-white">{stat.value}</dd>
                  <dd className="text-xs text-white/60">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Phones/tablets: swipeable rail */}
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 scrollbar-none lg:hidden">
            {suggestions.map((dest, i) => (
              <DestinationCard key={`rail-${dest.name}-${i}`} {...dest} className="h-44 w-36 snap-start" />
            ))}
          </div>

          {/* Desktop: two auto-scrolling columns */}
          <div className="hidden shrink-0 gap-4 lg:flex" aria-hidden>
            {[suggestions, [...suggestions].reverse()].map((column, col) => (
              <div key={col} className="relative h-[480px] overflow-hidden">
                <div className="absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-[#0B2426] to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-[#0B2426] to-transparent" />
                <div className={cn("flex flex-col gap-4", col === 0 ? "animate-scroll-up" : "animate-scroll-down")}>
                  {[...column, ...column].map((dest, i) => (
                    <DestinationCard
                      key={`col${col}-${dest.name}-${i}`}
                      {...dest}
                      className={col === 0 ? "h-[300px] w-[230px]" : "h-[230px] w-[190px]"}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showMapModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-6"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="routes-title"
            className="flex h-dvh w-full flex-col overflow-hidden bg-card sm:h-[min(85dvh,720px)] sm:max-w-5xl sm:rounded-3xl md:flex-row"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-[42dvh] shrink-0 bg-muted md:h-auto md:flex-1">
              <MapLeaflet
                center={[10.7202, 122.5621]}
                zoom={13}
                routes={[]}
                landmarks={[]}
                selectedRoute={selectedRouteId}
                showAllRoutes={selectedRouteId === null}
                showSelectedRouteBothDirections
                showLandmarks={false}
                showCenterMarker={false}
                showCurrentLocation={false}
                showLocateControl={false}
                decodedRoutes={routes}
                onRouteSelect={(routeId) => setSelectedRouteId(String(routeId))}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={closeModal}
                aria-label="Close routes"
                className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-10 rounded-full shadow-md md:hidden"
              >
                <X />
              </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col md:w-[380px] md:flex-none">
              <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                <div>
                  <h2 id="routes-title" className="text-lg font-bold text-foreground">
                    Jeepney routes in Iloilo
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {loadingRoutes ? "Loading routes…" : `${routes.length} routes · tap one to see it on the map`}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={closeModal} aria-label="Close routes" className="hidden md:inline-flex">
                  <X />
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
                {loadingRoutes ? (
                  <p className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading routes…
                  </p>
                ) : routes.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">No routes available</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {routes.map((route) => {
                      const isSelected = selectedRouteId === String(route.id)
                      return (
                        <button
                          type="button"
                          key={route.id}
                          ref={(element) => {
                            routeItemRefs.current[String(route.id)] = element
                          }}
                          onClick={() => setSelectedRouteId(isSelected ? null : String(route.id))}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                            isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/60",
                          )}
                        >
                          <span
                            className="h-8 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: route.routeColor || "#3b82f6" }}
                            aria-hidden
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-foreground">
                              {route.routeNumber} · {route.routeName}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Bus className="h-3 w-3" /> {route.vehicleTypeName}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <Button asChild size="lg" className="w-full">
                  <Link href="/dashboard/map">Open the map for directions</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
