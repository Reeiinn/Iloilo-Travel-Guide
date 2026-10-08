import type { DirectionsRoute } from "@/components/map-leaflet"

type LatLng = [number, number]

const EARTH_RADIUS_M = 6371000
const DEG = Math.PI / 180

// Distance (m) from the end of the route at which we consider the trip finished
const ARRIVAL_RADIUS_M = 25

/** Flat x/y in meters around a reference latitude; accurate enough at city scale. */
function toXY([lat, lng]: LatLng, lat0: number): [number, number] {
  return [lng * DEG * EARTH_RADIUS_M * Math.cos(lat0 * DEG), lat * DEG * EARTH_RADIUS_M]
}

export interface RouteIndex {
  route: DirectionsRoute
  lat0: number
  points: [number, number][]
  /** Distance along the route (m) at each point */
  cumulative: number[]
  total: number
  /** Distance along the route (m) where each step's maneuver happens */
  stepStarts: number[]
}

export function buildRouteIndex(route: DirectionsRoute): RouteIndex {
  const lat0 = route.coordinates[0]?.[0] ?? 0
  const points = route.coordinates.map((c) => toXY(c, lat0))

  const cumulative = [0]
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i]
    cumulative.push(cumulative[i - 1] + Math.hypot(bx - ax, by - ay))
  }
  const total = cumulative[cumulative.length - 1] ?? 0

  // Each step starts at its first coordinate, which is (nearly) a vertex of the full route.
  // Search forward only, so a route that loops back past an earlier point stays in order.
  const stepStarts: number[] = []
  let searchFrom = 0
  for (const step of route.steps) {
    const start = step.coordinates[0]
    if (!start || points.length === 0) {
      stepStarts.push(stepStarts[stepStarts.length - 1] ?? 0)
      continue
    }
    const [sx, sy] = toXY(start, lat0)
    let best = searchFrom
    let bestDist = Number.POSITIVE_INFINITY
    for (let i = searchFrom; i < points.length; i++) {
      const d = Math.hypot(points[i][0] - sx, points[i][1] - sy)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
      if (d < 1) break
    }
    stepStarts.push(cumulative[best])
    searchFrom = best
  }

  return { route, lat0, points, cumulative, total, stepStarts }
}

export interface RouteProgress {
  /** Step the traveler is currently on */
  currentStepIndex: number
  /** Step whose maneuver comes next (the one to show in the banner) */
  nextStepIndex: number
  distanceToManeuver: number
  remainingDistance: number
  remainingDuration: number
  /** How far (m) the traveler is from the route line */
  offRouteDistance: number
  arrived: boolean
}

export function getRouteProgress(index: RouteIndex, position: LatLng): RouteProgress {
  const { route, points, cumulative, total, stepStarts, lat0 } = index
  const [px, py] = toXY(position, lat0)

  // Snap the position onto the closest segment of the route
  let traveled = 0
  let offRouteDistance = points.length
    ? Math.hypot(points[0][0] - px, points[0][1] - py)
    : Number.POSITIVE_INFINITY
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i]
    const [bx, by] = points[i + 1]
    const dx = bx - ax
    const dy = by - ay
    const lengthSq = dx * dx + dy * dy
    const t = lengthSq > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq)) : 0
    const d = Math.hypot(ax + t * dx - px, ay + t * dy - py)
    if (d < offRouteDistance) {
      offRouteDistance = d
      traveled = cumulative[i] + t * Math.sqrt(lengthSq)
    }
  }

  let currentStepIndex = 0
  for (let i = 0; i < stepStarts.length; i++) {
    if (stepStarts[i] <= traveled + 1) currentStepIndex = i
  }
  const nextStepIndex = Math.min(currentStepIndex + 1, Math.max(route.steps.length - 1, 0))
  const distanceToManeuver =
    nextStepIndex > currentStepIndex ? stepStarts[nextStepIndex] - traveled : total - traveled

  const remainingOnLine = Math.max(0, total - traveled)
  const fraction = total > 0 ? remainingOnLine / total : 0

  return {
    currentStepIndex,
    nextStepIndex,
    distanceToManeuver: Math.max(0, distanceToManeuver),
    remainingDistance: route.distance * fraction,
    remainingDuration: route.duration * fraction,
    offRouteDistance,
    arrived: remainingOnLine < ARRIVAL_RADIUS_M && offRouteDistance < 40,
  }
}

/** Rounded like turn-by-turn apps: 10 m steps up close, 50 m steps further out. */
function roundNavMeters(meters: number) {
  if (meters < 100) return Math.max(10, Math.round(meters / 10) * 10)
  return Math.round(meters / 50) * 50
}

export function formatNavDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${roundNavMeters(meters)} m`
}

export function formatSpokenDistance(meters: number) {
  if (meters >= 1000) {
    const km = Math.round(meters / 100) / 10
    return `${km} ${km === 1 ? "kilometer" : "kilometers"}`
  }
  return `${roundNavMeters(meters)} meters`
}

export function formatArrivalTime(secondsFromNow: number) {
  return new Date(Date.now() + secondsFromNow * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}
