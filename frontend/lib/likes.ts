"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { findLandmarkByName } from "@/lib/places"

export type LikedItem = {
  id: string
  name: string
  category: "Place" | "Food"
  image: string
  rating?: number
  label?: string
}

const LIKES_STORAGE_KEY = "ilocate-liked-items"
// Older builds saved likes under these keys; read them only when the main key is empty
const LEGACY_STORAGE_KEYS = ["likedItems", "favorites"]
const LIKES_UPDATED_EVENT = "ilocate-likes-updated"

function fallbackImage(category: LikedItem["category"]) {
  return category === "Food"
    ? "/images/food/Local Food/iloilo-food.jpg"
    : "/images/places/Churches/miagao-church.jpg"
}

function normalizeItem(input: unknown, idx: number): LikedItem | null {
  if (!input || typeof input !== "object") return null

  const source = input as Record<string, unknown>
  const name = typeof source.name === "string" ? source.name.trim() : ""
  if (!name) return null

  const rawCategory =
    typeof source.category === "string"
      ? source.category.toLowerCase()
      : typeof source.type === "string"
        ? source.type.toLowerCase()
        : ""
  const category: LikedItem["category"] = rawCategory === "food" || rawCategory === "cafe" ? "Food" : "Place"

  const storedImage =
    typeof source.image === "string" ? source.image : typeof source.imageUrl === "string" ? source.imageUrl : ""
  const landmarkImage = findLandmarkByName(name)?.imageUrl
  const image =
    (landmarkImage && landmarkImage !== "/images/icons/placeholder.jpg" && landmarkImage) ||
    (storedImage && storedImage !== "/images/icons/placeholder.jpg" ? storedImage : fallbackImage(category))

  return {
    id: typeof source.id === "string" && source.id ? source.id : `liked-${idx}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    category,
    image,
    rating: typeof source.rating === "number" && Number.isFinite(source.rating) ? source.rating : undefined,
    label: typeof source.label === "string" ? source.label : undefined,
  }
}

function parseLikedItems(raw: string | null): LikedItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeItem).filter((item): item is LikedItem => Boolean(item))
  } catch {
    return []
  }
}

function readLikedItems(): LikedItem[] {
  if (typeof window === "undefined") return []
  try {
    for (const key of [LIKES_STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      const items = parseLikedItems(window.localStorage.getItem(key))
      if (items.length > 0) return items
    }
  } catch {
    // Storage can be blocked (private mode); treat as no likes
  }
  return []
}

function writeLikedItems(items: LikedItem[]) {
  try {
    window.localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore quota/private-mode errors; the in-memory state still updates
  }
  window.dispatchEvent(new Event(LIKES_UPDATED_EVENT))
}

const nameKey = (name: string) => name.trim().toLowerCase()

/**
 * Liked places and food, stored in localStorage and kept in sync across pages and tabs.
 * Items are matched by name so likes made on any page show up everywhere.
 */
export function useLikedItems() {
  const [likedItems, setLikedItems] = useState<LikedItem[]>([])

  useEffect(() => {
    const sync = () => setLikedItems(readLikedItems())
    sync()
    window.addEventListener("storage", sync)
    window.addEventListener(LIKES_UPDATED_EVENT, sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener(LIKES_UPDATED_EVENT, sync)
    }
  }, [])

  const likedNames = useMemo(() => new Set(likedItems.map((item) => nameKey(item.name))), [likedItems])

  const isLiked = useCallback((name: string) => likedNames.has(nameKey(name)), [likedNames])

  const toggleLike = useCallback((item: LikedItem) => {
    const current = readLikedItems()
    const key = nameKey(item.name)
    const next = current.some((existing) => nameKey(existing.name) === key)
      ? current.filter((existing) => nameKey(existing.name) !== key)
      : [...current, item]
    setLikedItems(next)
    writeLikedItems(next)
  }, [])

  const removeLike = useCallback((id: string) => {
    const next = readLikedItems().filter((item) => item.id !== id)
    setLikedItems(next)
    writeLikedItems(next)
  }, [])

  return { likedItems, isLiked, toggleLike, removeLike }
}
