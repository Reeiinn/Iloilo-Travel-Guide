"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import {
  Search,
  ArrowRightLeft,
  ArrowUpDown,
  MapPin,
  Navigation,
  Bus,
  ChevronRight,
  ChevronLeft,
  Locate,
  X,
  Crosshair,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { landmarks } from "@ilocate/backend/landmarks"
import { getUserPreferences } from "@/lib/preferences"
import { loadAndDecodeRoutes, type DecodedRoute } from "@ilocate/backend/routes"
import { getDirections, formatDistance, formatDuration, type DirectionsResult } from "@ilocate/backend/osrm"
import type { DirectionsRoute } from "@/components/map-leaflet"

const MapComponent = dynamic(() => import("@/components/map-leaflet"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-secondary">Loading map...</div>,
})

const MAP_CENTER: [number, number] = [10.6969, 122.5644]
const MAP_ZOOM = 13

const categoryOrder = [
  "Malls",
  "Churches",
  "Museum",
  "Beaches",
  "City Landmark & Attraction",
  "Local Food",
  "Cafes",
  "Restaurants",
] as const

type LandmarkCategory = (typeof categoryOrder)[number]

const localFoodKeywords = /batchoy|kansi|roberto|talabahan|seafood|lapaz|la paz|native|iloilo/i
const restaurantKeywords = /restaurant|resto|grill|house|eatery|diner|paluto|payag/i
const mallKeywords = /mall|sm city|robinsons|festive walk|atrium|plaza/i
const cityAttractionKeywords = /park|plaza|esplanade|attraction|landmark|monument|district|boardwalk|beach|heritage|island/i

function toLandmarkSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function getLandmarkKey(prefix: string, index: number, name: string, type: string, coordinates: [number, number]) {
  return `${prefix}-${index}-${toLandmarkSlug(name)}-${toLandmarkSlug(type)}-${coordinates[0]}-${coordinates[1]}`
}

function categorizeLandmark(name: string, type: string): LandmarkCategory {
  if (mallKeywords.test(name)) return "Malls"
  if (type === "Church") return "Churches"
  if (type === "Museum") return "Museum"
  if (type === "Beach") return "Beaches"
  if (type === "Cafe") return "Cafes"
  if (cityAttractionKeywords.test(name) || ["Urban", "Heritage", "Attraction", "Landmark", "Park"].includes(type)) {
    return "City Landmark & Attraction"
  }
  if (type === "Food" && localFoodKeywords.test(name)) return "Local Food"
  if (type === "Food" && restaurantKeywords.test(name)) return "Restaurants"
  if (type === "Food") return "Restaurants"
  return "City Landmark & Attraction"
}

const preferenceCategoryMap: Record<string, LandmarkCategory[]> = {
  "coffee-shops": ["Cafes"],
  restaurants: ["Restaurants", "Local Food"],
  beaches: ["Beaches"],
  churches: ["Churches"],
  malls: ["Malls"],
  "city-landmarks": ["City Landmark & Attraction"],
  museums: ["Museum"],
  // Legacy preference ids
  heritage: ["Museum", "City Landmark & Attraction"],
  shopping: ["Malls"],
  nightlife: ["City Landmark & Attraction"],
  arts: ["Museum", "City Landmark & Attraction"],
}

const CURRENT_LOCATION_LABEL = "Current Location"
const PINNED_LOCATION_LABEL = "📍 Pinned Location"

function isSubsequenceMatch(query: string, target: string) {
  let queryIndex = 0
  for (let i = 0; i < target.length && queryIndex < query.length; i++) {
    if (target[i] === query[queryIndex]) queryIndex += 1
  }
  return queryIndex === query.length
}

function getSuggestionScore(query: string, target: string) {
  if (!query) return 999
  if (target === query) return 0
  if (target.startsWith(query)) return 1
  if (target.split(/\s+/).some((word) => word.startsWith(query))) return 2
  if (target.includes(query)) return 3
  if (isSubsequenceMatch(query, target)) return 4
  return Number.POSITIVE_INFINITY
}

function FullScreenMapPageContent() {
  const searchParams = useSearchParams()
  const [from, setFrom] = useState(CURRENT_LOCATION_LABEL)
  const [to, setTo] = useState("")
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationLoading, setLocationLoading] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [routeMode, setRouteMode] = useState<"Palihog Bayad" | "Sa Lugar">("Palihog Bayad")
  const [showRoutes, setShowRoutes] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [showAllPujRoutes, setShowAllPujRoutes] = useState(true)
  const [selectedRouteDirection, setSelectedRouteDirection] = useState<"goingTo" | "returning" | null>(null)
  const [showMapSidebar, setShowMapSidebar] = useState(true)
  const [selectedLandmarkSection, setSelectedLandmarkSection] = useState<string | null>(null)
  const [selectedLandmarkName, setSelectedLandmarkName] = useState<string | null>(null)
  const [focusedLandmarkNames, setFocusedLandmarkNames] = useState<string[]>([])
  const [showLandmarksPanel, setShowLandmarksPanel] = useState(true)
  const [userPreferences, setUserPreferences] = useState<string[]>([])
  const [routes, setRoutes] = useState<DecodedRoute[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [directionsRoute, setDirectionsRoute] = useState<DirectionsRoute | null>(null)
  const [directionsLoading, setDirectionsLoading] = useState(false)
  const [directionsError, setDirectionsError] = useState<string | null>(null)
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null)
  const [activeSuggestionField, setActiveSuggestionField] = useState<"from" | "to" | null>(null)
  const [pendingGoToLandmark, setPendingGoToLandmark] = useState<string | null>(null)
  const [isPinDropMode, setIsPinDropMode] = useState(false)
  const [pinnedCoords, setPinnedCoords] = useState<[number, number] | null>(null)
  // Phone layout: floating search card + bottom sheet over a full-screen map
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [searchOpen, setSearchOpen] = useState(false)
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [sheetTab, setSheetTab] = useState<"routes" | "places">("routes")
  const [sheetHeight, setSheetHeight] = useState(0)
  const sheetRef = useRef<HTMLElement | null>(null)
  const routeItemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Get user's current location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setLocationLoading(false)
      setFrom("") // Clear default if geolocation not available
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude]
        setUserLocation(coords)
        setLocationLoading(false)
        setLocationError(null)
      },
      (error) => {
        setLocationError("Unable to get your location")
        setLocationLoading(false)
        setFrom("") // Clear default if location access denied
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoadingRoutes(true)
      try {
        const decodedRoutes = await loadAndDecodeRoutes()
        setRoutes(decodedRoutes)
      } catch (error) {
        console.error("Error loading routes:", error)
        setRoutes([])
      } finally {
        setLoadingRoutes(false)
      }
    }

    fetchRoutes()
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchPreferences = async () => {
      const savedPrefs = getUserPreferences()
      if (isMounted) setUserPreferences(savedPrefs)
    }

    fetchPreferences()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const landmarkParam = searchParams.get("landmark")
    if (!landmarkParam) return

    const decodedParam = decodeURIComponent(landmarkParam).trim()
    if (!decodedParam) return

    const normalizedParam = toLandmarkSlug(decodedParam)
    const matchedLandmark =
      landmarks.find((landmark) => toLandmarkSlug(landmark.name) === normalizedParam) ??
      landmarks.find((landmark) => landmark.name.toLowerCase() === decodedParam.toLowerCase())

    if (!matchedLandmark) return

    setSelectedLandmarkName(matchedLandmark.name)
    setSelectedLandmarkSection(null)
    setFocusedLandmarkNames([])

    if (searchParams.get("go") === "1") {
      setPendingGoToLandmark(matchedLandmark.name)
    }
  }, [searchParams])

  const categorizedLandmarks = useMemo(() => {
    const grouped: Record<LandmarkCategory, typeof landmarks> = {
      "Malls": [],
      "Churches": [],
      "Museum": [],
      "Beaches": [],
      "City Landmark & Attraction": [],
      "Local Food": [],
      "Cafes": [],
      "Restaurants": [],
    }

    for (const landmark of landmarks) {
      const category = categorizeLandmark(landmark.name, landmark.type)
      grouped[category].push(landmark)
    }

    return grouped
  }, [])

  const preferredLandmarks = useMemo(() => {
    if (!userPreferences.length) return []

    const selectedCategories = new Set<LandmarkCategory>()
    for (const pref of userPreferences) {
      const mapped = preferenceCategoryMap[pref] ?? []
      mapped.forEach((cat) => selectedCategories.add(cat))
    }

    const uniqueByName = new Map<string, (typeof landmarks)[number]>()
    categoryOrder.forEach((cat) => {
      if (!selectedCategories.has(cat)) return
      categorizedLandmarks[cat].forEach((landmark) => {
        if (!uniqueByName.has(landmark.name)) {
          uniqueByName.set(landmark.name, landmark)
        }
      })
    })

    return Array.from(uniqueByName.values())
  }, [categorizedLandmarks, userPreferences])

  const allPlacesAndFood = useMemo(() => landmarks, [])

  const sectionLandmarkNames = useMemo<Record<string, string[]>>(() => {
    const categoryNames: Record<string, string[]> = {}
    categoryOrder.forEach((category) => {
      categoryNames[category] = categorizedLandmarks[category].map((lm) => lm.name)
    })

    return {
      "All Places & Food": allPlacesAndFood.map((lm) => lm.name),
      "Based on your Preferences": preferredLandmarks.map((lm) => lm.name),
      ...categoryNames,
    }
  }, [allPlacesAndFood, preferredLandmarks, categorizedLandmarks])

  const handleLandmarkSectionToggle = (section: string) => {
    if (selectedLandmarkSection === section) {
      setSelectedLandmarkSection(null)
      setFocusedLandmarkNames([])
      return
    }

    setSelectedLandmarkSection(section)
    setSelectedLandmarkName(null)
    setFocusedLandmarkNames(sectionLandmarkNames[section] ?? [])
  }

  const visibleLandmarks = useMemo(() => {
    if (selectedLandmarkName) {
      return landmarks.filter((lm) => lm.name === selectedLandmarkName)
    }

    if (focusedLandmarkNames.length > 0) {
      const focusedSet = new Set(focusedLandmarkNames)
      return landmarks.filter((lm) => focusedSet.has(lm.name))
    }

    return []
  }, [focusedLandmarkNames, selectedLandmarkName])

  const selectedLandmark = useMemo(() => {
    if (!selectedLandmarkName) return null
    return landmarks.find((landmark) => landmark.name === selectedLandmarkName) ?? null
  }, [selectedLandmarkName])

  const locationSuggestions = useMemo(() => {
    const baseSuggestions = landmarks.map((landmark) => ({
      label: landmark.name,
      subtitle: landmark.type,
    }))

    if (userLocation) {
      return [
        { label: CURRENT_LOCATION_LABEL, subtitle: "Use your live location" },
        ...baseSuggestions,
      ]
    }

    return baseSuggestions
  }, [userLocation])

  const findBestSuggestions = (query: string) => {
    const normalizedQuery = query.toLowerCase().trim()
    if (!normalizedQuery) return locationSuggestions.slice(0, 8)

    return locationSuggestions
      .map((suggestion) => ({
        ...suggestion,
        score: getSuggestionScore(normalizedQuery, suggestion.label.toLowerCase()),
      }))
      .filter((suggestion) => Number.isFinite(suggestion.score))
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score
        return a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
      })
      .slice(0, 8)
  }

  const fromSuggestions = useMemo(() => findBestSuggestions(from), [from, locationSuggestions])
  const toSuggestions = useMemo(() => findBestSuggestions(to), [to, locationSuggestions])

  const applySuggestion = (field: "from" | "to", value: string) => {
    if (field === "from") {
      setFrom(value)
    } else {
      setTo(value)
    }
    setActiveSuggestionField(null)
  }

  const swapLocations = () => {
    setFrom(to)
    setTo(from)
    // Also swap the coordinates
    const tempOrigin = originCoords
    setOriginCoords(destinationCoords)
    setDestinationCoords(tempOrigin)
  }

  // Find landmark by name (case-insensitive partial match)
  const findLandmarkByName = (name: string) => {
    const normalizedName = name.toLowerCase().trim()
    return landmarks.find(
      (lm) =>
        lm.name.toLowerCase() === normalizedName ||
        lm.name.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(lm.name.toLowerCase())
    )
  }

  const searchRoute = async (originValue: string, destinationValue: string) => {
    const normalizedFrom = originValue.trim()
    const normalizedTo = destinationValue.trim()

    if (!normalizedFrom || !normalizedTo) {
      setDirectionsError("Please enter both origin and destination")
      return
    }

    setDirectionsLoading(true)
    setDirectionsError(null)
    setDirectionsRoute(null)
    setShowRoutes(true)

    let originLatLng: [number, number]
    let destLatLng: [number, number]

    // Handle "Current Location" as origin
    const isFromCurrentLocation = normalizedFrom.toLowerCase() === CURRENT_LOCATION_LABEL.toLowerCase()
    
    if (isFromCurrentLocation) {
      if (!userLocation) {
        setDirectionsError("Current location not available. Please enter a location or enable location access.")
        setDirectionsLoading(false)
        return
      }
      originLatLng = userLocation
    } else {
      const fromLandmark = findLandmarkByName(normalizedFrom)
      if (!fromLandmark) {
        setDirectionsError(`Could not find location: "${normalizedFrom}". Try selecting from Landmarks.`)
        setDirectionsLoading(false)
        return
      }
      originLatLng = fromLandmark.coordinates
    }

    // Handle "Current Location" as destination
    const isToCurrentLocation = normalizedTo.toLowerCase() === CURRENT_LOCATION_LABEL.toLowerCase()
    const isPinnedDestination = normalizedTo === PINNED_LOCATION_LABEL

    if (isPinnedDestination) {
      if (!pinnedCoords) {
        setDirectionsError("No pin placed. Click 'Pick on map' to pin your destination.")
        setDirectionsLoading(false)
        return
      }
      destLatLng = pinnedCoords
    } else if (isToCurrentLocation) {
      if (!userLocation) {
        setDirectionsError("Current location not available. Please enter a location or enable location access.")
        setDirectionsLoading(false)
        return
      }
      destLatLng = userLocation
    } else {
      const toLandmark = findLandmarkByName(normalizedTo)
      if (!toLandmark) {
        setDirectionsError(`Could not find location: "${normalizedTo}". Try selecting from Landmarks.`)
        setDirectionsLoading(false)
        return
      }
      destLatLng = toLandmark.coordinates
    }

    setOriginCoords(originLatLng)
    setDestinationCoords(destLatLng)

    try {
      const result = await getDirections(
        { lat: originLatLng[0], lng: originLatLng[1] },
        { lat: destLatLng[0], lng: destLatLng[1] }
      )

      if (result.success && result.route) {
        setDirectionsRoute(result.route)
        setDirectionsError(null)
        // Clear selected PUJ route when showing directions
        setSelectedRoute(null)
        setShowAllPujRoutes(false)
      } else {
        setDirectionsError(result.error || "Failed to get directions")
        setDirectionsRoute(null)
      }
    } catch (error) {
      setDirectionsError("An error occurred while fetching directions")
      setDirectionsRoute(null)
    } finally {
      setDirectionsLoading(false)
    }
  }

  // Handle route search from the manual fields
  const handleSearchRoute = async () => {
    await searchRoute(from, to)
  }

  const handleGoToLandmark = async (landmarkName: string) => {
    const destination = landmarkName.trim()
    if (!destination) return

    const origin = userLocation ? CURRENT_LOCATION_LABEL : from.trim()

    if (!origin) {
      setDirectionsError("Current location not available. Please allow location access or enter an origin manually.")
      return
    }

    setSelectedLandmarkName(destination)
    setSelectedLandmarkSection(null)
    setFocusedLandmarkNames([])
    setFrom(origin)
    setTo(destination)
    setShowRoutes(true)

    await searchRoute(origin, destination)
  }

  useEffect(() => {
    if (!pendingGoToLandmark) return
    if (locationLoading) return

    if (!userLocation) {
      setDirectionsError("Current location not available. Please allow location access and try again.")
      setPendingGoToLandmark(null)
      return
    }

    void handleGoToLandmark(pendingGoToLandmark)
    setPendingGoToLandmark(null)
  }, [pendingGoToLandmark, locationLoading, userLocation])

  // Clear only the computed route data
  const clearDirections = () => {
    setDirectionsRoute(null)
    setDirectionsError(null)
    setOriginCoords(null)
    setDestinationCoords(null)
    setShowRoutes(false)
    setFrom(userLocation ? CURRENT_LOCATION_LABEL : "")
    setTo("")
    setPinnedCoords(null)
    setIsPinDropMode(false)
  }

  // Exit route mode completely (used by cancel/close actions)
  const handleExitRoute = () => {
    clearDirections()
    setPendingGoToLandmark(null)
    setSelectedLandmarkName(null)
    setSelectedLandmarkSection(null)
    setFocusedLandmarkNames([])
    setSelectedRoute(null)
    setShowAllPujRoutes(true)
    setSelectedRouteDirection(null)
  }

  // Handle route click from route list - allows toggle when tapping active item.
  const handleRouteListClick = (routeId: string | number) => {
    const routeIdString = String(routeId)
    if (selectedRoute === routeIdString) {
      // If clicking same route, clear selection
      setSelectedRoute(null)
      setShowAllPujRoutes(true)
      setSelectedRouteDirection(null)
    } else {
      // Show direction choice for new route
      setShowAllPujRoutes(false)
      setSelectedRoute(routeIdString)
      setSelectedRouteDirection(null) // User must choose direction
    }
  }

  // Handle route click from map - always select and reveal the route list for synced behavior.
  const handleRouteMapSelect = (routeId: string | number) => {
    const routeIdString = String(routeId)
    setShowAllPujRoutes(false)
    setShowMapSidebar(true)
    setSheetTab("routes")
    setSheetExpanded(true)
    if (selectedRoute !== routeIdString) {
      setSelectedRoute(routeIdString)
      setSelectedRouteDirection(null)
    }
  }

  // Handle direction selection
  const handleDirectionSelect = (direction: "goingTo" | "returning") => {
    setSelectedRouteDirection(direction)
  }

  useEffect(() => {
    if (!selectedRoute) return
    // Wait a frame so an opening sheet/sidebar has laid out before scrolling
    const frame = requestAnimationFrame(() => {
      routeItemRefs.current[selectedRoute]?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    })
    return () => cancelAnimationFrame(frame)
  }, [selectedRoute, showMapSidebar, sheetExpanded])

  // Track the phone bottom sheet's height so map controls sit just above it
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const observer = new ResizeObserver(() => setSheetHeight(sheet.offsetHeight))
    observer.observe(sheet)
    return () => observer.disconnect()
  }, [isDesktop])

  const mapRoutes = useMemo(
    () =>
      routes.map((route) => ({
        id: route.id,
        name: `${route.routeNumber} - ${route.routeName}`,
        code: route.vehicleTypeName,
        stops: route.stops.map((s) => s.address),
        fare: "",
        time: "",
      })),
    [routes]
  )

  // Pin drop handlers
  const handlePinDropped = (coords: [number, number]) => {
    setPinnedCoords(coords)
  }

  const handlePinDone = () => {
    if (!pinnedCoords) return
    setIsPinDropMode(false)
    setTo(PINNED_LOCATION_LABEL)
    void searchRoute(from, PINNED_LOCATION_LABEL)
  }

  const handlePinCancel = () => {
    setIsPinDropMode(false)
    setPinnedCoords(null)
    if (to === PINNED_LOCATION_LABEL) setTo("")
  }

  const submitSearch = async () => {
    // On phones, get the search card out of the way so the result is visible
    if (!isDesktop && from.trim() && to.trim()) setSearchOpen(false)
    await handleSearchRoute()
  }

  const startPinDrop = () => {
    setIsPinDropMode(true)
    setPinnedCoords(null)
    setSearchOpen(false)
  }

  const landmarkSections = [
    { key: "All Places & Food", items: allPlacesAndFood, empty: "No landmarks available yet." },
    {
      key: "Based on your Preferences",
      items: preferredLandmarks,
      empty: "Set your preferences in your profile to get personalized suggestions.",
    },
    ...categoryOrder.map((category) => ({
      key: category as string,
      items: categorizedLandmarks[category],
      empty: "No landmarks available yet.",
    })),
  ]

  const directionsVisible = showRoutes && Boolean(directionsLoading || directionsRoute || directionsError)
  const sheetMode: "directions" | "landmark" | "browse" = directionsVisible
    ? "directions"
    : selectedLandmark
      ? "landmark"
      : "browse"

  const renderSuggestions = (field: "from" | "to", suggestions: typeof fromSuggestions) =>
    activeSuggestionField === field &&
    suggestions.length > 0 && (
      <div
        role="listbox"
        className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-60 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg"
      >
        {suggestions.map((suggestion) => (
          <button
            key={`${field}-${suggestion.label}`}
            type="button"
            role="option"
            aria-selected={false}
            onMouseDown={(e) => {
              e.preventDefault()
              applySuggestion(field, suggestion.label)
            }}
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
          >
            <span className="truncate text-sm text-foreground">{suggestion.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{suggestion.subtitle}</span>
          </button>
        ))}
      </div>
    )

  // Inputs use text-base on phones: iOS zooms the page when focusing text smaller than 16px
  const inputClass =
    "min-h-11 w-full rounded-xl border border-input bg-background py-2.5 pl-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 lg:text-sm"

  const searchForm = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1 self-stretch py-4" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full border-2 border-primary" />
          <span className="w-px flex-1 border-l-2 border-dotted border-border" />
          <MapPin className="h-3.5 w-3.5 text-destructive" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="relative">
            <label htmlFor="route-from" className="sr-only">From</label>
            <input
              id="route-from"
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              onFocus={() => setActiveSuggestionField("from")}
              onBlur={() => setTimeout(() => setActiveSuggestionField(null), 120)}
              placeholder={locationLoading ? "Getting your location…" : "Choose starting point"}
              disabled={locationLoading}
              autoComplete="off"
              className={cn(inputClass, "pr-11", from === CURRENT_LOCATION_LABEL && "font-medium text-primary")}
            />
            {!locationLoading && renderSuggestions("from", fromSuggestions)}
            {locationLoading ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Getting your location" />
              </span>
            ) : userLocation && from !== CURRENT_LOCATION_LABEL ? (
              <button
                type="button"
                onClick={() => setFrom(CURRENT_LOCATION_LABEL)}
                aria-label="Use my current location"
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
              >
                <Locate className="h-4 w-4" />
              </button>
            ) : from === CURRENT_LOCATION_LABEL ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" title="Using your current location">
                <Locate className="h-4 w-4" />
              </span>
            ) : null}
          </div>

          <div className="relative">
            <label htmlFor="route-to" className="sr-only">To</label>
            <input
              id="route-to"
              type="text"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                if (pinnedCoords && e.target.value !== PINNED_LOCATION_LABEL) {
                  setPinnedCoords(null)
                }
              }}
              onFocus={() => setActiveSuggestionField("to")}
              onBlur={() => setTimeout(() => setActiveSuggestionField(null), 120)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitSearch()
              }}
              placeholder="Where to?"
              autoComplete="off"
              enterKeyHint="search"
              className={cn(inputClass, "pr-3")}
            />
            {renderSuggestions("to", toSuggestions)}
          </div>
        </div>

        <button
          type="button"
          onClick={swapLocations}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          aria-label="Swap start and destination"
        >
          <ArrowUpDown className="h-4 w-4" />
        </button>
      </div>

      {locationError && from === "" && (
        <p className="text-sm text-destructive">{locationError}. Enter a starting point manually.</p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={startPinDrop}
          className={cn("shrink-0", isPinDropMode && "border-primary bg-primary/10 text-primary")}
        >
          <Crosshair /> Pick on map
        </Button>
        <Button onClick={() => void submitSearch()} disabled={directionsLoading} className="flex-1">
          {directionsLoading ? <Loader2 className="animate-spin" /> : <Search />}
          {directionsLoading ? "Finding…" : "Search route"}
        </Button>
      </div>

      {/* When a place is selected its card shows the error instead */}
      {directionsError && !directionsVisible && !selectedLandmark && (
        <p className="text-sm text-destructive">{directionsError}</p>
      )}
    </div>
  )

  const routeList = (
    <div className="flex flex-col gap-2">
      {loadingRoutes ? (
        <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading routes…
        </p>
      ) : routes.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No routes available</p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setSelectedRoute(null)
              setShowAllPujRoutes((prev) => !prev)
              setSelectedRouteDirection(null)
            }}
            aria-pressed={showAllPujRoutes}
            className={cn(
              "flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
              showAllPujRoutes ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40",
            )}
          >
            <span>
              <span className="block text-sm font-semibold text-foreground">Show all routes</span>
              <span className="block text-xs text-muted-foreground">Display every PUJ route on the map</span>
            </span>
            <span
              className={cn(
                "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                showAllPujRoutes ? "bg-primary" : "bg-muted-foreground/30",
              )}
              aria-hidden
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                  showAllPujRoutes ? "left-[1.125rem]" : "left-0.5",
                )}
              />
            </span>
          </button>

          {routes.map((route) => {
            const isSelected = selectedRoute === String(route.id)
            return (
              <div
                key={route.id}
                ref={(element) => {
                  routeItemRefs.current[String(route.id)] = element
                }}
                className={cn(
                  "scroll-mt-2 overflow-hidden rounded-xl border transition-colors",
                  isSelected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleRouteListClick(route.id)}
                  aria-expanded={isSelected}
                  className="flex min-h-14 w-full items-center gap-3 p-3 text-left"
                >
                  <span
                    className="h-9 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: route.routeColor || "#3b82f6" }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {route.routeNumber} · {route.routeName}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {route.vehicleTypeName} · {route.stops.length} stops
                    </span>
                  </span>
                  <ChevronRight
                    className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isSelected && "rotate-90")}
                  />
                </button>

                {isSelected && (
                  <div className="border-t border-border px-3 pb-3 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Direction</p>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={selectedRouteDirection === "goingTo" ? "default" : "outline"}
                        onClick={() => handleDirectionSelect("goingTo")}
                      >
                        <Navigation /> Going to
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedRouteDirection === "returning" ? "default" : "outline"}
                        onClick={() => handleDirectionSelect("returning")}
                      >
                        <ArrowRightLeft /> Returning
                      </Button>
                    </div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Stops ({route.stops.length})
                    </p>
                    <ol className="max-h-48 overflow-y-auto pr-1">
                      {route.stops.map((stop, idx) => (
                        <li key={idx} className="relative border-l-2 border-border py-1 pl-4 text-xs text-foreground">
                          <span
                            className="absolute -left-[6px] top-2 h-2.5 w-2.5 rounded-full border-2 bg-background"
                            style={{ borderColor: route.routeColor || "#3b82f6" }}
                            aria-hidden
                          />
                          {stop.address}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )

  const landmarkList = (
    <div className="flex flex-col gap-2">
      {landmarkSections.map((section) => {
        const isOpen = selectedLandmarkSection === section.key
        return (
          <div
            key={section.key}
            className={cn(
              "overflow-hidden rounded-xl border transition-colors",
              isOpen ? "border-primary bg-primary/5" : "border-border bg-background",
            )}
          >
            <button
              type="button"
              onClick={() => handleLandmarkSectionToggle(section.key)}
              aria-expanded={isOpen}
              className="flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left"
            >
              <span className="text-sm font-semibold text-foreground">{section.key}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {section.items.length}
                <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-border p-1.5">
                {section.items.length > 0 ? (
                  section.items.map((lm, index) => (
                    <button
                      type="button"
                      key={getLandmarkKey(section.key, index, lm.name, lm.type, lm.coordinates)}
                      onClick={() => {
                        setSelectedLandmarkName(lm.name)
                        setFocusedLandmarkNames([])
                      }}
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                        selectedLandmarkName === lm.name ? "bg-primary/10" : "hover:bg-muted",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate text-sm text-foreground">{lm.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{lm.type}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-2 text-sm text-muted-foreground">{section.empty}</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const landmarkCard = selectedLandmark && (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
          <Image
            src={selectedLandmark.imageUrl || "/images/icons/placeholder.jpg"}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold leading-tight text-foreground">{selectedLandmark.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {categorizeLandmark(selectedLandmark.name, selectedLandmark.type)} · ~25 min away
          </p>
        </div>
      </div>
      {/* e.g. location access denied: surface it here, the search card may be collapsed */}
      {directionsError && !directionsVisible && <p className="text-sm text-destructive">{directionsError}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => void handleGoToLandmark(selectedLandmark.name)} disabled={directionsLoading}>
          {directionsLoading ? <Loader2 className="animate-spin" /> : <Navigation />}
          {directionsLoading ? "Finding…" : "Directions"}
        </Button>
        <Button variant="outline" onClick={() => setSelectedLandmarkName(null)}>
          Back
        </Button>
      </div>
    </div>
  )

  const directionsPanel = directionsVisible && (
    <div className="flex flex-col gap-3">
      {directionsLoading ? (
        <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Finding the best route…
        </p>
      ) : directionsError ? (
        <>
          <p className="text-sm text-destructive">{directionsError}</p>
          <Button variant="outline" onClick={clearDirections}>
            <X /> Clear
          </Button>
        </>
      ) : directionsRoute ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground">{formatDuration(directionsRoute.duration)}</p>
              <p className="truncate text-sm text-muted-foreground">
                {formatDistance(directionsRoute.distance)} · to {to || "destination"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExitRoute} className="shrink-0">
              <X /> End
            </Button>
          </div>
          {directionsRoute.steps.length > 0 && (
            <ol className="flex flex-col border-t border-border pt-3">
              {directionsRoute.steps.map((step, i) => (
                <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
                  <span
                    className={cn(
                      "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                      i === 0 ? "bg-green-500" : i === directionsRoute.steps.length - 1 ? "bg-red-500" : "bg-muted-foreground/40",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{step.instruction}</p>
                    <p className="text-xs text-muted-foreground">{formatDistance(step.distance)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : null}
    </div>
  )

  const pinBanner = isPinDropMode && (
    <div className="flex items-center gap-3 rounded-2xl bg-background/95 p-3 shadow-lg backdrop-blur-sm">
      <Crosshair className="h-5 w-5 shrink-0 animate-pulse text-primary" />
      <p className="flex-1 text-sm font-medium text-foreground">
        {pinnedCoords ? "Drag the pin to adjust" : isDesktop ? "Click the map to set your destination" : "Tap the map to set your destination"}
      </p>
      {pinnedCoords && (
        <Button size="sm" onClick={handlePinDone} disabled={directionsLoading}>
          {directionsLoading ? "Finding…" : "Done"}
        </Button>
      )}
      <Button size="icon-sm" variant="ghost" onClick={handlePinCancel} aria-label="Cancel pin drop">
        <X />
      </Button>
    </div>
  )

  const mapElement = (
    <MapComponent
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      showCenterMarker={false}
      routes={mapRoutes}
      landmarks={visibleLandmarks}
      selectedRoute={selectedRoute}
      showAllRoutes={showAllPujRoutes}
      selectedRouteDirection={selectedRouteDirection}
      selectedLandmarkName={selectedLandmarkName}
      focusedLandmarkNames={focusedLandmarkNames}
      decodedRoutes={routes}
      directionsRoute={directionsRoute}
      originMarker={originCoords}
      destinationMarker={destinationCoords}
      pinDropMode={isPinDropMode}
      onPinDropped={handlePinDropped}
      onRouteSelect={handleRouteMapSelect}
    />
  )

  if (!isDesktop) {
    return (
      <div className="relative h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] w-full overflow-hidden bg-muted">
        <div
          className="map-mobile-chrome absolute inset-0"
          style={{ ["--map-bottom-offset" as string]: `${sheetHeight}px` }}
        >
          {mapElement}
        </div>

        {/* Floating search */}
        <div className="absolute inset-x-0 top-0 z-10 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          {isPinDropMode ? (
            pinBanner
          ) : searchOpen ? (
            <div className="rounded-2xl bg-background p-3 shadow-xl">
              <div className="mb-1 flex items-center justify-between">
                <h1 className="text-sm font-semibold text-foreground">Plan a trip</h1>
                <Button size="icon-sm" variant="ghost" onClick={() => setSearchOpen(false)} aria-label="Close search">
                  <X />
                </Button>
              </div>
              {searchForm}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-12 w-full items-center gap-3 rounded-full bg-background px-4 text-left shadow-lg"
            >
              <Search className="h-5 w-5 shrink-0 text-primary" />
              <span className={cn("truncate text-base", to ? "text-foreground" : "text-muted-foreground")}>
                {to || "Where to?"}
              </span>
            </button>
          )}
        </div>

        {/* Bottom sheet */}
        <section
          ref={sheetRef}
          aria-label="Routes and places"
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-3xl border-t border-border/60 bg-background shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-[height] duration-300 ease-out",
            // Keep the drawn route visible above turn-by-turn steps
            sheetMode === "directions" ? "max-h-[45%]" : "max-h-[70%]",
          )}
          style={{ height: sheetMode === "browse" ? (sheetExpanded ? "70%" : "11rem") : undefined }}
        >
          {sheetMode === "browse" ? (
            <>
              <button
                type="button"
                onClick={() => setSheetExpanded((prev) => !prev)}
                aria-expanded={sheetExpanded}
                aria-label={sheetExpanded ? "Collapse panel" : "Expand panel"}
                className="flex h-7 w-full shrink-0 items-center justify-center"
              >
                <span className="h-1.5 w-10 rounded-full bg-border" />
              </button>
              <div className="shrink-0 px-4 pb-3">
                <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                  {(
                    [
                      { id: "routes", label: `Jeepney routes${routes.length ? ` (${routes.length})` : ""}`, icon: Bus },
                      { id: "places", label: "Places", icon: MapPin },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={sheetTab === tab.id}
                      onClick={() => {
                        setSheetTab(tab.id)
                        setSheetExpanded(true)
                      }}
                      className={cn(
                        "flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors",
                        sheetTab === tab.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground",
                      )}
                    >
                      <tab.icon className="h-4 w-4" /> {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                {sheetTab === "routes" ? routeList : landmarkList}
              </div>
            </>
          ) : (
            <div className="min-h-0 overflow-y-auto overscroll-contain p-4 pt-5">
              {sheetMode === "directions" ? directionsPanel : landmarkCard}
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      {showMapSidebar && (
        <aside className="flex w-[380px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-background p-4">
          <div>
            <h1 className="text-lg font-bold text-foreground">Interactive Map</h1>
            <p className="text-sm text-muted-foreground">Plan a trip or explore jeepney routes.</p>
          </div>

          <section className="rounded-2xl bg-secondary p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Plan a trip</h2>
            {searchForm}
            {(directionsRoute || directionsError) && (
              <Button onClick={clearDirections} variant="outline" className="mt-2 w-full">
                <X /> Clear
              </Button>
            )}
          </section>

          <section className="rounded-2xl bg-secondary p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Ride mode</h2>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              {(["Palihog Bayad", "Sa Lugar"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={routeMode === mode}
                  onClick={() => setRouteMode(mode)}
                  className={cn(
                    "min-h-10 rounded-lg text-sm font-semibold transition-colors",
                    routeMode === mode ? "bg-background text-primary shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-secondary p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">PUJ Routes</h2>
              <Bus className="h-4 w-4 text-primary" />
            </div>
            {routeList}
          </section>
        </aside>
      )}

      <div className="relative min-w-0 flex-1 bg-muted">
        {mapElement}

        {isPinDropMode && (
          <div className="absolute left-1/2 top-4 z-10 w-[min(92%,560px)] -translate-x-1/2">{pinBanner}</div>
        )}

        <button
          type="button"
          onClick={() => setShowMapSidebar((prev) => !prev)}
          aria-label={showMapSidebar ? "Collapse routes panel" : "Expand routes panel"}
          className="absolute left-0 top-1/2 z-10 flex h-11 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {showMapSidebar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setShowLandmarksPanel((prev) => !prev)}
          aria-label={showLandmarksPanel ? "Collapse landmarks panel" : "Expand landmarks panel"}
          className="absolute right-0 top-1/2 z-10 flex h-11 w-8 -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {showLandmarksPanel ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {directionsVisible && (
          <div className="absolute bottom-4 right-12 z-10 max-h-[55%] w-[min(90%,360px)] overflow-y-auto rounded-2xl bg-background/95 p-4 shadow-xl backdrop-blur-sm">
            {directionsPanel}
          </div>
        )}

        {selectedLandmark && (
          <div
            className={cn(
              "absolute left-12 z-10 w-[min(90%,360px)] rounded-2xl bg-background/95 p-4 shadow-xl backdrop-blur-sm",
              directionsVisible ? "top-4" : "bottom-4",
            )}
          >
            {landmarkCard}
          </div>
        )}
      </div>

      {showLandmarksPanel && (
        <aside className="w-[340px] shrink-0 overflow-y-auto border-l border-border bg-background p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Landmarks</h2>
          {landmarkList}
        </aside>
      )}
    </div>
  )
}

export default function FullScreenMapPage() {
  return (
    <Suspense fallback={<div className="h-dvh w-full bg-muted" />}>
      <FullScreenMapPageContent />
    </Suspense>
  )
}
