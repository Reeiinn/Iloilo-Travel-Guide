"use client"

import { Suspense } from "react"
import { landmarks } from "@ilocate/backend/landmarks"
import { ListingView, type ListingItem } from "@/components/listing-view"
import { getPlaceImage, getRating, isFoodType } from "@/lib/places"

const categories = ["All", "Malls", "Churches", "Museum", "City Landmark & Attraction", "Beaches"] as const

const queryCategories: Record<string, string> = {
  malls: "Malls",
  churches: "Churches",
  museum: "Museum",
  museums: "Museum",
  "city-landmark-attraction": "City Landmark & Attraction",
  "city-landmarks": "City Landmark & Attraction",
  beaches: "Beaches",
  beach: "Beaches",
}

const mallKeywords = ["mall", "sm ", "robinsons", "gaisano", "festive", "megaworld", "ayala", "central", "city mall", "mall of", "shangri-la"]

function placeFilters(name: string, type: string) {
  const filters: string[] = []
  const lowerName = name.toLowerCase()
  if (type === "Mall" || mallKeywords.some((keyword) => lowerName.includes(keyword))) filters.push("Malls")
  if (type === "Church") filters.push("Churches")
  if (type === "Museum") filters.push("Museum")
  if (type === "Urban" || type === "Heritage") filters.push("City Landmark & Attraction")
  if (type === "Beach") filters.push("Beaches")
  return filters
}

const allPlaces: ListingItem[] = landmarks
  .filter((landmark) => !isFoodType(landmark.type))
  .map((landmark): ListingItem => ({
    name: landmark.name,
    image: getPlaceImage(landmark.type, landmark.imageUrl),
    category: landmark.type,
    rating: getRating(landmark.type),
    kind: "Place",
    filters: placeFilters(landmark.name, landmark.type),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export default function PlacesPage() {
  return (
    <Suspense fallback={null}>
      <ListingView
        title="Places"
        countLabel={(count) => `${count} ${count === 1 ? "destination" : "destinations"} to explore`}
        searchPlaceholder="Search places"
        categories={categories}
        queryCategories={queryCategories}
        items={allPlaces}
      />
    </Suspense>
  )
}
