import { landmarks, type Landmark } from "@ilocate/backend/landmarks"

export const PLACEHOLDER_IMAGE = "/images/icons/placeholder.jpg"

export function toLandmarkSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export function isFoodType(type: string) {
  return type === "Food" || type === "Cafe"
}

export function getRating(type: string) {
  if (type === "Food" || type === "Cafe") return 4.5
  if (type === "Heritage" || type === "Church") return 4.7
  if (type === "Museum" || type === "Urban") return 4.6
  if (type === "Mall") return 4.4
  if (type === "Beach") return 4.5
  return 4.0
}

/** The landmark's own photo, or a category stock photo when it has none. */
export function getPlaceImage(type: string, imageUrl?: string) {
  if (imageUrl && imageUrl !== PLACEHOLDER_IMAGE) return imageUrl
  if (type === "Food") return "/images/food/Local Food/iloilo-food.jpg"
  if (type === "Cafe") return "/images/food/Cafes/cafe.jpg"
  if (type === "Church") return "/images/places/Churches/miagao-church.jpg"
  if (type === "Museum") return "/images/places/Museums/ilomoca museum.webp"
  if (type === "Heritage" || type === "Urban") return "/images/places/Attractions/esplanade.jpg"
  if (type === "Mall") return "/images/places/Malls/sm city iloilo.jpg"
  return PLACEHOLDER_IMAGE
}

export function findLandmarkByName(name: string): Landmark | undefined {
  const normalized = name.trim().toLowerCase()
  return landmarks.find((landmark) => landmark.name.trim().toLowerCase() === normalized)
}

/** Deep link that opens the map with directions to a landmark. */
export function directionsHref(name: string) {
  return `/dashboard/map?landmark=${toLandmarkSlug(name)}&go=1`
}
