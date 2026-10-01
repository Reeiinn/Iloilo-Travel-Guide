"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Search, SearchX } from "lucide-react"
import { CategoryChips } from "@/components/category-chips"
import { PageHeader } from "@/components/page-header"
import { PlaceCard, type PlaceSummary } from "@/components/place-card"
import { PlaceSheet } from "@/components/place-sheet"
import { likedItemFromPlace, useLikedItems } from "@/lib/likes"

export type ListingItem = PlaceSummary & {
  /** Which chip(s) this item belongs to, besides "All" */
  filters: string[]
}

/**
 * Searchable, filterable grid of places with like buttons and a details sheet.
 * `queryCategories` maps `?category=` values (used by deep links) to chip labels.
 */
export function ListingView({
  title,
  countLabel,
  searchPlaceholder,
  categories,
  queryCategories,
  items,
}: {
  title: string
  countLabel: (count: number) => string
  searchPlaceholder: string
  categories: readonly string[]
  queryCategories: Record<string, string>
  items: ListingItem[]
}) {
  const searchParams = useSearchParams()
  const { isLiked, toggleLike } = useLikedItems()
  const [activeCategory, setActiveCategory] = useState("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<PlaceSummary | null>(null)

  useEffect(() => {
    const category = searchParams.get("category")?.toLowerCase().trim()
    const resolved = category ? queryCategories[category] : undefined
    if (resolved) setActiveCategory(resolved)
  }, [searchParams, queryCategories])

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    return items.filter(
      (item) =>
        (activeCategory === "All" || item.filters.includes(activeCategory)) &&
        (!query || item.name.toLowerCase().includes(query)),
    )
  }, [items, activeCategory, search])

  const likePlace = (place: PlaceSummary) => toggleLike(likedItemFromPlace(place))

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-5 lg:px-6 lg:pt-8">
      <PageHeader title={title} description={countLabel(filtered.length)} />

      {/* Sticky search + filters so they stay reachable while scrolling a long list */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 mb-4 bg-secondary/95 px-4 pb-3 pt-1 backdrop-blur-md lg:top-16 lg:mx-0 lg:px-0">
        <div className="relative mb-3 md:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="listing-search" className="sr-only">
            {searchPlaceholder}
          </label>
          <input
            id="listing-search"
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            enterKeyHint="search"
            className="h-12 w-full rounded-2xl border border-input bg-card pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:text-sm"
          />
        </div>
        <CategoryChips options={categories} value={activeCategory} onChange={setActiveCategory} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl bg-card px-6 py-14 text-center">
          <SearchX className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-semibold text-foreground">No matches</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another name or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5">
          {filtered.map((item, index) => (
            <PlaceCard
              key={`${item.name}-${index}`}
              place={item}
              liked={isLiked(item.name)}
              onSelect={() => setSelected(item)}
              onToggleLike={() => likePlace(item)}
            />
          ))}
        </div>
      )}

      <PlaceSheet
        place={selected}
        liked={selected ? isLiked(selected.name) : false}
        onToggleLike={selected ? () => likePlace(selected) : undefined}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
