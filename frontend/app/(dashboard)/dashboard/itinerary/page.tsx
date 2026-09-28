"use client"

import { useState } from "react"
import { CalendarDays, Plus, Trash2, Wallet } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PlaceCard, type PlaceSummary } from "@/components/place-card"
import { PlaceSheet } from "@/components/place-sheet"
import { cn } from "@/lib/utils"

const travelCompanies = [
  { id: 1, name: "Travel Company (Name)", image: "/images/places/Churches/miagao-church.jpg", rating: 4.9, cost: "Free" },
  { id: 2, name: "Travel Company (Name)", image: "/images/places/Attractions/gigantes-island.jpg", rating: 4.8, cost: "PHP 500" },
  { id: 3, name: "Travel Company (Name)", image: "/images/places/Attractions/garin-farm.jpg", rating: 4.7, cost: "PHP 150" },
  { id: 4, name: "Travel Company (Name)", image: "/images/places/Attractions/esplanade.jpg", rating: 4.6, cost: "Free" },
  { id: 5, name: "Travel Company (Name)", image: "/images/places/Churches/miagao-church.jpg", rating: 4.5, cost: "Free" },
  { id: 6, name: "Travel Company (Name)", image: "/images/food/Local Food/iloilo-food.jpg", rating: 4.8, cost: "PHP 50-200" },
]

const suggestedActivities = [
  "Visit Miag-ao Church (UNESCO Heritage)",
  "Try La Paz Batchoy at Ted's Oldtimer",
  "Stroll along Iloilo River Esplanade",
  "Explore Molo Mansion",
  "Island hopping at Islas de Gigantes",
]

const costBreakdown = [
  { label: "Transportation", value: "PHP 200 - 500" },
  { label: "Food", value: "PHP 300 - 800" },
  { label: "Entrance fees", value: "PHP 150 - 500" },
]

type ItineraryItem = {
  id: number
  name: string
  day: number
  time: string
}

export default function ItineraryPage() {
  const [activeTab, setActiveTab] = useState<"planner" | "cost">("planner")
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([
    { id: 1, name: "Miag-ao Church", day: 1, time: "9:00 AM" },
    { id: 2, name: "La Paz Batchoy Lunch", day: 1, time: "12:00 PM" },
    { id: 3, name: "Iloilo Esplanade", day: 1, time: "4:00 PM" },
  ])
  const [totalDays, setTotalDays] = useState(3)
  const [selected, setSelected] = useState<PlaceSummary | null>(null)

  const addToItinerary = (name: string) =>
    setItinerary((prev) => [...prev, { id: Date.now(), name, day: 1, time: "10:00 AM" }])

  const removeFromItinerary = (id: number) => setItinerary((prev) => prev.filter((item) => item.id !== id))

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-5 lg:px-6 lg:pt-8">
      <PageHeader title="Itinerary" description="Plan your days and budget in Iloilo." />

      <div className="flex flex-col gap-4 lg:flex-row-reverse lg:items-start">
        {/* Planner */}
        <div className="w-full shrink-0 rounded-3xl bg-card p-4 shadow-sm sm:p-5 lg:w-[420px]">
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(
              [
                { id: "planner", label: "Days", icon: CalendarDays },
                { id: "cost", label: "Budget", icon: Wallet },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground",
                )}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "planner" ? (
            <>
              <div className="mt-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Your trip</h2>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Length
                  <select
                    value={totalDays}
                    onChange={(e) => setTotalDays(Number(e.target.value))}
                    className="min-h-10 rounded-lg border border-input bg-background px-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 1 ? "day" : "days"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {Array.from({ length: totalDays }).map((_, dayIndex) => {
                  const dayItems = itinerary.filter((item) => item.day === dayIndex + 1)
                  return (
                    <div key={dayIndex} className="rounded-2xl border border-border p-3">
                      <p className="mb-2 text-sm font-bold text-primary">Day {dayIndex + 1}</p>
                      {dayItems.length > 0 ? (
                        <ul className="flex flex-col gap-1.5">
                          {dayItems.map((item) => (
                            <li key={item.id} className="flex items-center gap-3 rounded-xl bg-secondary py-1 pl-3 pr-1">
                              <span className="w-16 shrink-0 text-xs font-semibold text-primary">{item.time}</span>
                              <span className="min-w-0 flex-1 text-sm text-foreground">{item.name}</span>
                              <button
                                type="button"
                                onClick={() => removeFromItinerary(item.id)}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-destructive"
                                aria-label={`Remove ${item.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nothing planned yet</p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4">
                <h2 className="mb-2 text-sm font-semibold text-foreground">Suggested activities</h2>
                <div className="flex flex-col gap-1">
                  {suggestedActivities.map((activity) => (
                    <button
                      key={activity}
                      type="button"
                      onClick={() => addToItinerary(activity)}
                      className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Plus className="h-4 w-4" />
                      </span>
                      {activity}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-2xl bg-secondary p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Estimated cost per day</h2>
              <dl className="space-y-2 text-sm">
                {costBreakdown.map((row) => (
                  <div key={row.label} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-foreground">{row.value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
                  <dt className="text-foreground">Total (est.)</dt>
                  <dd className="text-primary">PHP 650 - 1,800</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative h-56 min-w-0 flex-1 overflow-hidden rounded-3xl bg-muted shadow-sm sm:h-80 lg:h-[640px]">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=122.4800%2C10.6200%2C122.6500%2C10.7600&layer=mapnik&marker=10.6969%2C122.5644"
            className="h-full w-full border-0"
            title="Itinerary map view"
            loading="lazy"
          />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Travel companies</h2>
        <p className="mb-3 text-sm text-muted-foreground">Need a guide? Check these out.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {travelCompanies.map((company) => {
            const place: PlaceSummary = {
              name: company.name,
              image: company.image,
              category: company.cost,
              rating: company.rating,
              kind: "Place",
            }
            return (
              <PlaceCard
                key={company.id}
                place={place}
                onSelect={() => setSelected(place)}
              />
            )
          })}
        </div>
      </section>

      <PlaceSheet place={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
