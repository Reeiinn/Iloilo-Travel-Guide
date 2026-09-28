"use client"

import { Suspense } from "react"
import { landmarks } from "@ilocate/backend/landmarks"
import { ListingView, type ListingItem } from "@/components/listing-view"
import { getPlaceImage, getRating, isFoodType } from "@/lib/places"

const categories = ["All", "Local Food", "Cafes", "Restaurants"] as const

const queryCategories: Record<string, string> = {
  "local-food": "Local Food",
  cafes: "Cafes",
  restaurant: "Restaurants",
  restaurants: "Restaurants",
}

function getFoodCategory(name: string, type: string) {
  const normalizedName = name.toLowerCase()

  // Explicit overrides requested by product requirements.
  if (normalizedName.includes("kalanph")) return "Restaurants"
  if (normalizedName.includes("alicia") && normalizedName.includes("batchoy")) return "Local Food"
  if (normalizedName.includes("netong") && normalizedName.includes("batchoy")) return "Local Food"

  const isCafe = type === "Cafe" || /cafe|coffee|coff|latt[eé]|book latté|café/.test(normalizedName)
  const isRestaurant = /restaurant|resto|grill|grill and|seafood|kitchen|house|diner|canteen|eatery|branch|batchoy|kansi|talabahan/.test(normalizedName)

  if (type === "Cafe" || (type === "Food" && isCafe && !/restaurant|resto|grill|kitchen|house|branch/.test(normalizedName))) {
    return "Cafes"
  }
  if (type === "Food" && isRestaurant) return "Restaurants"
  return "Local Food"
}

const allFood: ListingItem[] = landmarks
  .filter((landmark) => isFoodType(landmark.type))
  .map((landmark) => {
    const category = getFoodCategory(landmark.name, landmark.type)
    return {
      name: landmark.name,
      image: getPlaceImage(landmark.type, landmark.imageUrl),
      category,
      rating: getRating(landmark.type),
      kind: "Food",
      filters: [category],
    }
  })

export default function FoodPage() {
  return (
    <Suspense fallback={null}>
      <ListingView
        title="Food & Cafes"
        countLabel={(count) => `${count} spots to try`}
        searchPlaceholder="Search food spots"
        categories={categories}
        queryCategories={queryCategories}
        items={allFood}
      />
    </Suspense>
  )
}
