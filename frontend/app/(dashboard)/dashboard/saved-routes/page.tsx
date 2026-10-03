"use client"

import { useState } from "react"
import Link from "next/link"
import { BookmarkCheck, ChevronDown, Clock, Trash2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"

type SavedRoute = {
  id: number
  from: string
  to: string
  fare: string
  time: string
  date: string
  savedAgo: string
}

const initialRoutes: SavedRoute[] = [
  { id: 1, from: "CPU", to: "SM City Iloilo", fare: "PHP 11 - PHP 41", time: "~20 min", date: "May 28", savedAgo: "Saved 3 days ago" },
  { id: 2, from: "Molo Church", to: "La Paz Market", fare: "PHP 10 - PHP 30", time: "~15 min", date: "May 25", savedAgo: "Saved 6 days ago" },
  { id: 3, from: "City Proper", to: "SM Starmall", fare: "PHP 11 - PHP 35", time: "~18 min", date: "May 22", savedAgo: "Saved 9 days ago" },
  { id: 4, from: "Jaro Cathedral", to: "Iloilo Esplanade", fare: "PHP 12 - PHP 38", time: "~22 min", date: "May 20", savedAgo: "Saved 11 days ago" },
  { id: 5, from: "Arevalo", to: "Plazoleta Gay", fare: "PHP 10 - PHP 32", time: "~25 min", date: "May 18", savedAgo: "Saved 13 days ago" },
]

export default function SavedRoutesPage() {
  const [routes, setRoutes] = useState(initialRoutes)
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null)
  const [lastRemoved, setLastRemoved] = useState<{ route: SavedRoute; index: number } | null>(null)

  const removeRoute = (id: number) => {
    const index = routes.findIndex((r) => r.id === id)
    if (index === -1) return
    setLastRemoved({ route: routes[index], index })
    setRoutes((prev) => prev.filter((r) => r.id !== id))
  }

  const undoRemove = () => {
    if (!lastRemoved) return
    setRoutes((prev) => [...prev.slice(0, lastRemoved.index), lastRemoved.route, ...prev.slice(lastRemoved.index)])
    setLastRemoved(null)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-5 lg:pt-8">
      <PageHeader
        title="Saved routes"
        description={`${routes.length} ${routes.length === 1 ? "route" : "routes"} bookmarked`}
      />

      {lastRemoved && (
        <div role="status" className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-foreground px-4 py-2 text-sm text-background">
          <span className="min-w-0 truncate">Removed {lastRemoved.route.from} → {lastRemoved.route.to}</span>
          <button type="button" onClick={undoRemove} className="min-h-10 shrink-0 font-semibold text-brand">
            Undo
          </button>
        </div>
      )}

      {routes.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl bg-card px-6 py-14 text-center shadow-sm">
          <BookmarkCheck className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold text-foreground">No saved routes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Routes you bookmark from the map will appear here.</p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/map">Open the map</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {routes.map((route) => {
            const isExpanded = expandedRoute === route.id
            return (
              <li key={route.id} className="overflow-hidden rounded-3xl bg-card shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-stretch gap-3 p-4 text-left"
                >
                  <span className="flex flex-col items-center py-1" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-primary" />
                    <span className="w-px flex-1 border-l-2 border-dotted border-border" />
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{route.from}</span>
                    <span className="mt-3 block truncate text-sm font-semibold text-foreground">{route.to}</span>
                    <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {route.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" /> {route.fare}
                      </span>
                      <span>{route.savedAgo}</span>
                    </span>
                  </span>
                  <ChevronDown
                    className={cn("h-5 w-5 shrink-0 self-center text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Route stops</p>
                    <ol className="mb-4 space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" /> {route.from}
                        <span className="text-muted-foreground">(Start)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" /> Tagbak Terminal
                        <span className="text-muted-foreground">(Transfer)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-accent" /> {route.to}
                        <span className="text-muted-foreground">(End)</span>
                      </li>
                    </ol>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => removeRoute(route.id)}
                    >
                      <Trash2 /> Remove
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
