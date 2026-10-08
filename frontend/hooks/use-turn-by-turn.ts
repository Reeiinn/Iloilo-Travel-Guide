"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { DirectionsRoute } from "@/components/map-leaflet"
import { buildRouteIndex, formatSpokenDistance, getRouteProgress } from "@/lib/navigation"

export type NavigationStatus = "locating" | "navigating" | "rerouting" | "arrived" | "error"

// Off-route updates in a row before asking for a new route, and the minimum gap between reroutes
const OFF_ROUTE_UPDATES_BEFORE_REROUTE = 3
const REROUTE_COOLDOWN_MS = 15000

interface UseTurnByTurnOptions {
  active: boolean
  route: DirectionsRoute | null
  muted: boolean
  onReroute: (from: [number, number]) => Promise<void> | void
}

export function useTurnByTurn({ active, route, muted, onReroute }: UseTurnByTurnOptions) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rerouting, setRerouting] = useState(false)

  const onRerouteRef = useRef(onReroute)
  onRerouteRef.current = onReroute

  const routeIndex = useMemo(() => (route && route.coordinates.length >= 2 ? buildRouteIndex(route) : null), [route])
  const progress = useMemo(
    () => (routeIndex && position ? getRouteProgress(routeIndex, position) : null),
    [routeIndex, position],
  )

  // Live position
  useEffect(() => {
    if (!active) return
    if (!navigator.geolocation) {
      setError("Location isn't supported on this device.")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude])
        setAccuracy(pos.coords.accuracy)
        setError(null)
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access is off. Allow it in your browser to navigate."
            : "Searching for GPS signal…",
        )
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      setPosition(null)
      setAccuracy(null)
      setError(null)
    }
  }, [active])

  // Keep the screen on while navigating
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = () => {
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (cancelled) void sentinel.release()
          else lock = sentinel
        })
        .catch(() => {
          // Not allowed (e.g. battery saver); navigation still works
        })
    }
    const handleVisibility = () => {
      if (document.visibilityState === "visible") acquire()
    }

    acquire()
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", handleVisibility)
      void lock?.release().catch(() => {})
    }
  }, [active])

  // Ask for a new route when the traveler keeps drifting off the line
  const offRouteCountRef = useRef(0)
  const lastRerouteRef = useRef(0)
  useEffect(() => {
    if (!active || !progress || !position || rerouting || progress.arrived) return

    const threshold = Math.max(40, (accuracy ?? 0) * 1.5)
    if (progress.offRouteDistance <= threshold) {
      offRouteCountRef.current = 0
      return
    }

    offRouteCountRef.current += 1
    if (offRouteCountRef.current < OFF_ROUTE_UPDATES_BEFORE_REROUTE) return
    if (Date.now() - lastRerouteRef.current < REROUTE_COOLDOWN_MS) return

    offRouteCountRef.current = 0
    lastRerouteRef.current = Date.now()
    setRerouting(true)
    Promise.resolve(onRerouteRef.current(position)).finally(() => setRerouting(false))
  }, [active, progress, position, accuracy, rerouting])

  // Voice guidance: announce each maneuver once ahead of time, and again when it's close
  const spokenRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    spokenRef.current = new Set()
  }, [route, active])

  useEffect(() => {
    if (!active || muted || !progress || !route || !("speechSynthesis" in window)) return

    const speak = (key: string, text: string) => {
      if (spokenRef.current.has(key)) return
      spokenRef.current.add(key)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }

    if (progress.arrived) {
      speak("arrived", "You have arrived at your destination")
      return
    }

    const i = progress.nextStepIndex
    const step = route.steps[i]
    if (!step) return

    const isArrival = step.maneuver?.type === "arrive"
    const instruction = isArrival ? "you will arrive at your destination" : lowerFirst(step.instruction)
    const distance = progress.distanceToManeuver

    if (distance <= 50) {
      spokenRef.current.add(`ahead-${i}`)
      if (!isArrival) speak(`now-${i}`, step.instruction)
    } else {
      speak(`ahead-${i}`, `In ${formatSpokenDistance(distance)}, ${instruction}`)
    }
  }, [active, muted, progress, route])

  useEffect(() => {
    if ((!active || muted) && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }, [active, muted])

  const status: NavigationStatus =
    error && !position
      ? "error"
      : !position
        ? "locating"
        : progress?.arrived
          ? "arrived"
          : rerouting
            ? "rerouting"
            : "navigating"

  return { position, progress, status, error }
}

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1)
}
