"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Landmark } from "@ilocate/backend/landmarks"
import type { DecodedRoute } from "@ilocate/backend/routes"

const currentLocationIcon = L.icon({
  iconUrl: "/images/icons/MapIconLight.svg",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [38, 48],
  iconAnchor: [19, 47],
  popupAnchor: [0, -40],
  shadowSize: [44, 24],
  shadowAnchor: [14, 24],
})

export interface DirectionsRoute {
  coordinates: [number, number][]
  distance: number
  duration: number
  steps: Array<{
    instruction: string
    distance: number
    duration: number
    coordinates: [number, number][]
  }>
}

interface MapComponentProps {
  center: [number, number]
  zoom: number
  routes: Array<{
    id: number | string
    name: string
    code: string
    stops: string[]
    fare: string
    time: string
  }>
  landmarks: Landmark[]
  selectedRoute: number | string | null
  selectedRouteDirection?: "goingTo" | "returning" | null
  selectedLandmarkName?: string | null
  focusedLandmarkNames?: string[]
  showLandmarks?: boolean
  showCenterMarker?: boolean
  showCurrentLocation?: boolean
  showLocateControl?: boolean
  requireClickToZoom?: boolean
  showAllRoutes?: boolean
  showSelectedRouteBothDirections?: boolean
  decodedRoutes?: DecodedRoute[]
  directionsRoute?: DirectionsRoute | null
  originMarker?: [number, number] | null
  destinationMarker?: [number, number] | null
  pinDropMode?: boolean
  onPinDropped?: (coords: [number, number]) => void
  onRouteSelect?: (routeId: number | string) => void
}



const EMPTY_NAMES: string[] = []

function isValidCoordinatePair(coords: [number, number] | undefined | null): coords is [number, number] {
  if (!coords || coords.length !== 2) return false
  const [lat, lng] = coords
  return Number.isFinite(lat) && Number.isFinite(lng)
}

export default function MapLeaflet({
  center,
  zoom,
  routes,
  landmarks,
  selectedRoute,
  selectedRouteDirection,
  selectedLandmarkName,
  focusedLandmarkNames = EMPTY_NAMES,
  showLandmarks = true,
  showCenterMarker = true,
  showCurrentLocation = true,
  showLocateControl = true,
  requireClickToZoom = false,
  showAllRoutes = false,
  showSelectedRouteBothDirections = false,
  decodedRoutes = [],
  directionsRoute = null,
  originMarker = null,
  destinationMarker = null,
  pinDropMode = false,
  onPinDropped,
  onRouteSelect,
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const landmarkMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const routePolylinesRef = useRef<L.Polyline[]>([])
  const hasFittedAllRoutesRef = useRef(false)
  const directionsPolylineRef = useRef<L.Polyline | null>(null)
  const originMarkerRef = useRef<L.Marker | null>(null)
  const destinationMarkerRef = useRef<L.Marker | null>(null)
  const pinDropMarkerRef = useRef<L.Marker | null>(null)
  const currentLocationMarkerRef = useRef<L.Marker | null>(null)
  const scrollZoomEnabledRef = useRef(false)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const currentLocationRef = useRef<[number, number] | null>(null)
  currentLocationRef.current = currentLocation

  // Keep the latest callbacks in refs so parents passing inline functions
  // don't force the map layers to be torn down and redrawn on every render.
  const onRouteSelectRef = useRef(onRouteSelect)
  onRouteSelectRef.current = onRouteSelect
  const onPinDroppedRef = useRef(onPinDropped)
  onPinDroppedRef.current = onPinDropped

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const coords: [number, number] = [latitude, longitude]
        setCurrentLocation(coords)
        setLocationError(null)

        // Add current location marker
        if (map.current && !currentLocationMarkerRef.current) {
          currentLocationMarkerRef.current = L.marker(coords, {
            icon: currentLocationIcon,
          })
            .bindPopup("You are here")
            .addTo(map.current)
        }
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location."
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }
        setLocationError(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map
    map.current = L.map(mapContainer.current).setView(center, zoom)
    let removeClickToggle: (() => void) | null = null

    if (requireClickToZoom) {
      scrollZoomEnabledRef.current = false
      map.current.scrollWheelZoom.disable()

      const container = map.current.getContainer()
      const handleContainerClick = () => {
        if (!map.current) return
        if (scrollZoomEnabledRef.current) {
          map.current.scrollWheelZoom.disable()
        } else {
          map.current.scrollWheelZoom.enable()
        }
        scrollZoomEnabledRef.current = !scrollZoomEnabledRef.current
      }

      container.addEventListener("click", handleContainerClick)
      removeClickToggle = () => container.removeEventListener("click", handleContainerClick)
    }

    // Add OpenStreetMap tiles (CARTO basemaps now return "API KEY REQUIRED" tiles)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current)

    // Center marker
    if (showCenterMarker) {
      L.marker(center, {
        icon: L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup("Iloilo City Center")
        .addTo(map.current)
    }

    // Get current location
    if (showCurrentLocation) {
      getCurrentLocation()
    }

    // Add locate control button
    const LocateControl = L.Control.extend({
      options: {
        position: 'topright'
      },

      onAdd: function (map: L.Map) {
        const container = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control')
        const button = L.DomUtil.create('a', 'leaflet-control-locate-button', container)
        button.href = '#'
        button.title = 'Show my location'
        button.innerHTML = '📍'

        L.DomEvent.on(button, 'click', function (e) {
          L.DomEvent.stopPropagation(e)
          L.DomEvent.preventDefault(e)
          getCurrentLocation()
          if (currentLocationRef.current) {
            map.setView(currentLocationRef.current, 15)
          }
        })

        return container
      }
    })

    if (map.current && showLocateControl) {
      map.current.addControl(new LocateControl())
    }

    return () => {
      if (removeClickToggle) {
        removeClickToggle()
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current = null
      }
    }
  }, [center, zoom, showCenterMarker, showCurrentLocation, showLocateControl, requireClickToZoom])

  useEffect(() => {
    if (!map.current || !mapContainer.current) return

    const mapInstance = map.current
    const container = mapContainer.current

    const refreshMapSize = () => {
      if (!map.current) return
      mapInstance.invalidateSize({ animate: false })
    }

    // Run once after mount and again on next frame for layout shifts.
    refreshMapSize()
    const rafId = requestAnimationFrame(refreshMapSize)
    const timeoutIds = [
      window.setTimeout(refreshMapSize, 100),
      window.setTimeout(refreshMapSize, 300),
      window.setTimeout(refreshMapSize, 800),
    ]

    const resizeObserver = new ResizeObserver(() => {
      refreshMapSize()
    })

    resizeObserver.observe(container)
    window.addEventListener("resize", refreshMapSize)
    window.addEventListener("orientationchange", refreshMapSize)

    return () => {
      cancelAnimationFrame(rafId)
      timeoutIds.forEach((id) => window.clearTimeout(id))
      resizeObserver.disconnect()
      window.removeEventListener("resize", refreshMapSize)
      window.removeEventListener("orientationchange", refreshMapSize)
    }
  }, [])

  useEffect(() => {
    hasFittedAllRoutesRef.current = false
  }, [decodedRoutes, showAllRoutes])

  useEffect(() => {
    if (!map.current) return
    const mapInstance = map.current

    const removeMarkerSafely = (marker: L.Marker) => {
      try {
        marker.closePopup()
      } catch {
        // noop
      }

      if (mapInstance.hasLayer(marker)) {
        mapInstance.removeLayer(marker)
      }
    }

    // Clear existing markers
    markersRef.current.forEach(removeMarkerSafely)
    markersRef.current = []
    landmarkMarkersRef.current.clear()

    // Clear existing route polylines
    routePolylinesRef.current.forEach((polyline) => {
      if (mapInstance.hasLayer(polyline)) {
        mapInstance.removeLayer(polyline)
      }
    })
    routePolylinesRef.current = []

    // Add landmark markers
    if (showLandmarks) {
      landmarks.forEach((landmark) => {
        if (!isValidCoordinatePair(landmark.coordinates)) return

        const isFocused = focusedLandmarkNames.includes(landmark.name)
        const isSelected = selectedLandmarkName === landmark.name
        const marker = L.marker(landmark.coordinates, {
          icon: L.icon({
            iconUrl: isSelected
              ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"
              : isFocused
                ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
                : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        })
          .bindPopup(`<strong>${landmark.name}</strong><br/>${landmark.type}`)
          .addTo(mapInstance)

        markersRef.current.push(marker)
        landmarkMarkersRef.current.set(landmark.name, marker)
      })
    }

    const shouldRenderRoutes = decodedRoutes.length > 0 && (showAllRoutes || selectedRoute !== null)

    if (shouldRenderRoutes) {
      const routesToRender = showAllRoutes
        ? decodedRoutes
        : decodedRoutes.filter((route) => String(route.id) === selectedRoute)

      let selectedRouteCoords: [number, number][] = []
      const allRouteCoords: [number, number][] = []

      routesToRender.forEach((decodedRoute) => {
        const isSelected = selectedRoute !== null && String(decodedRoute.id) === selectedRoute

        const shouldShowBothDirectionsForSelectedRoute =
          isSelected && showSelectedRouteBothDirections && selectedRouteDirection == null

        const routeVariants = showAllRoutes || shouldShowBothDirectionsForSelectedRoute
          ? [
              {
                direction: "goingTo" as const,
                coords: decodedRoute.goingToCoordinates.filter((coords) => isValidCoordinatePair(coords)),
              },
              {
                direction: "returning" as const,
                coords: decodedRoute.returningCoordinates.filter((coords) => isValidCoordinatePair(coords)),
              },
            ]
          : [
              {
                direction: selectedRouteDirection === "returning" ? "returning" as const : "goingTo" as const,
                coords:
                  selectedRouteDirection === "returning"
                    ? decodedRoute.returningCoordinates.filter((coords) => isValidCoordinatePair(coords))
                    : decodedRoute.goingToCoordinates.filter((coords) => isValidCoordinatePair(coords)),
              },
            ]

        routeVariants.forEach(({ direction, coords }) => {
          if (coords.length < 2) return

          const routePolyline = L.polyline(coords, {
            color: decodedRoute.routeColor || "hsl(var(--color-primary))",
            weight: isSelected ? 6 : 4,
            opacity: isSelected ? 0.95 : showAllRoutes ? 0.8 : 0.72,
            dashArray: direction === "returning" ? "10, 6" : undefined,
          })
            .bindPopup(
              `<strong>${decodedRoute.routeNumber} - ${decodedRoute.routeName}</strong><br/>${direction === "goingTo" ? "Going to" : "Returning"}`
            )
            .on("click", () => {
              onRouteSelectRef.current?.(decodedRoute.id)
            })
            .addTo(mapInstance)

          routePolylinesRef.current.push(routePolyline)
          allRouteCoords.push(...coords)

          if (isSelected) {
            selectedRouteCoords = coords
          }
        })
      })

      if (selectedRouteCoords.length >= 2) {
        mapInstance.fitBounds(L.latLngBounds(selectedRouteCoords), { padding: [50, 50] })
      } else if (showAllRoutes && !directionsRoute && allRouteCoords.length >= 2 && !hasFittedAllRoutesRef.current) {
        mapInstance.fitBounds(L.latLngBounds(allRouteCoords), { padding: [50, 50] })
        hasFittedAllRoutesRef.current = true
      }
    }
  }, [selectedRoute, selectedRouteDirection, selectedLandmarkName, focusedLandmarkNames, landmarks, showLandmarks, decodedRoutes, showAllRoutes, showSelectedRouteBothDirections, directionsRoute])

  useEffect(() => {
    if (!map.current || !selectedLandmarkName) return

    const marker = landmarkMarkersRef.current.get(selectedLandmarkName)
    if (!marker) return

    if (!map.current.hasLayer(marker)) return

    const latLng = marker.getLatLng()
    map.current.setView(latLng, Math.max(map.current.getZoom(), 15), { animate: true })
  }, [selectedLandmarkName])

  useEffect(() => {
    if (!map.current || selectedLandmarkName || focusedLandmarkNames.length === 0) return

    const focusedMarkers = focusedLandmarkNames
      .map((name) => landmarkMarkersRef.current.get(name))
      .filter((marker): marker is L.Marker => Boolean(marker))

    if (focusedMarkers.length === 0) return

    if (focusedMarkers.length === 1) {
      const only = focusedMarkers[0]
      if (!map.current.hasLayer(only)) return
      map.current.setView(only.getLatLng(), Math.max(map.current.getZoom(), 15), { animate: true })
      return
    }

    const bounds = L.latLngBounds(focusedMarkers.map((marker) => marker.getLatLng()))
    map.current.fitBounds(bounds, { padding: [50, 50] })
  }, [focusedLandmarkNames, selectedLandmarkName])

  // Handle current location marker updates
  useEffect(() => {
    if (!map.current || !currentLocation) return
    const mapInstance = map.current

    // Remove existing current location marker
    if (currentLocationMarkerRef.current) {
      try {
        currentLocationMarkerRef.current.closePopup()
      } catch {
        // noop
      }

      if (mapInstance.hasLayer(currentLocationMarkerRef.current)) {
        mapInstance.removeLayer(currentLocationMarkerRef.current)
      }
    }

    // Add new current location marker
    currentLocationMarkerRef.current = L.marker(currentLocation, {
      icon: currentLocationIcon,
    })
      .bindPopup("You are here")
      .addTo(mapInstance)
  }, [currentLocation])

  // Handle OSRM directions route
  useEffect(() => {
    if (!map.current) return
    const mapInstance = map.current

    // Clear existing directions polyline
    if (directionsPolylineRef.current) {
      if (mapInstance.hasLayer(directionsPolylineRef.current)) {
        mapInstance.removeLayer(directionsPolylineRef.current)
      }
      directionsPolylineRef.current = null
    }

    // Clear existing origin/destination markers
    if (originMarkerRef.current) {
      if (mapInstance.hasLayer(originMarkerRef.current)) {
        mapInstance.removeLayer(originMarkerRef.current)
      }
      originMarkerRef.current = null
    }

    if (destinationMarkerRef.current) {
      if (mapInstance.hasLayer(destinationMarkerRef.current)) {
        mapInstance.removeLayer(destinationMarkerRef.current)
      }
      destinationMarkerRef.current = null
    }

    // Add origin marker
    if (originMarker && isValidCoordinatePair(originMarker)) {
      originMarkerRef.current = L.marker(originMarker, {
        icon: L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup("<strong>Start</strong>")
        .addTo(mapInstance)
    }

    // Add destination marker
    if (destinationMarker && isValidCoordinatePair(destinationMarker)) {
      destinationMarkerRef.current = L.marker(destinationMarker, {
        icon: L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup("<strong>Destination</strong>")
        .addTo(mapInstance)
    }

    // Add directions route polyline
    if (directionsRoute && directionsRoute.coordinates.length >= 2) {
      const validCoords = directionsRoute.coordinates.filter((coords) => isValidCoordinatePair(coords))

      if (validCoords.length >= 2) {
        directionsPolylineRef.current = L.polyline(validCoords, {
          color: "#2563eb",
          weight: 5,
          opacity: 0.9,
        })
          .addTo(mapInstance)

        // Fit bounds to show route
        const bounds = L.latLngBounds(validCoords)
        mapInstance.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [directionsRoute, originMarker, destinationMarker])

  // Handle pin drop mode — lets users click/drag to place a custom destination pin
  useEffect(() => {
    if (!map.current) return
    const mapInstance = map.current

    if (!pinDropMode) {
      // Remove the draggable pin when mode is turned off
      if (pinDropMarkerRef.current) {
        if (mapInstance.hasLayer(pinDropMarkerRef.current)) {
          mapInstance.removeLayer(pinDropMarkerRef.current)
        }
        pinDropMarkerRef.current = null
      }
      mapInstance.getContainer().style.cursor = ""
      return
    }

    mapInstance.getContainer().style.cursor = "crosshair"

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const coords: [number, number] = [e.latlng.lat, e.latlng.lng]

      // Remove any existing draggable pin
      if (pinDropMarkerRef.current) {
        if (mapInstance.hasLayer(pinDropMarkerRef.current)) {
          mapInstance.removeLayer(pinDropMarkerRef.current)
        }
        pinDropMarkerRef.current = null
      }

      // Place a new draggable orange pin
      const marker = L.marker(coords, {
        draggable: true,
        icon: L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup("<strong>📍 Your Destination</strong><br/><small>Drag to adjust position</small>")
        .addTo(mapInstance)
        .openPopup()

      marker.on("dragend", () => {
        const newLatLng = marker.getLatLng()
        onPinDroppedRef.current?.([newLatLng.lat, newLatLng.lng])
      })

      pinDropMarkerRef.current = marker
      onPinDroppedRef.current?.(coords)
    }

    mapInstance.on("click", handleMapClick)

    return () => {
      mapInstance.off("click", handleMapClick)
      mapInstance.getContainer().style.cursor = ""
    }
  }, [pinDropMode])

  // isolate: keeps Leaflet's internal z-indexes (up to 1000) from covering app sheets and menus
  return <div ref={mapContainer} className="isolate h-full w-full" />
}
