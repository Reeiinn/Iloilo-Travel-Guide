"use client"

import {
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  Loader2,
  LocateFixed,
  MapPinOff,
  Merge,
  Navigation2,
  RotateCw,
  Undo2,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DirectionsRoute } from "@/components/map-leaflet"
import type { NavigationStatus } from "@/hooks/use-turn-by-turn"
import { formatArrivalTime, formatNavDistance, type RouteProgress } from "@/lib/navigation"
import { formatDistance, formatDuration } from "@ilocate/backend/osrm"

type Maneuver = DirectionsRoute["steps"][number]["maneuver"]

function getManeuverIcon(maneuver: Maneuver): LucideIcon {
  const type = maneuver?.type
  const modifier = maneuver?.modifier ?? ""

  if (type === "arrive") return Flag
  if (type === "depart") return Navigation2
  if (type === "roundabout" || type === "rotary" || type === "roundabout turn") return RotateCw
  if (type === "merge") return Merge
  if (modifier === "uturn") return Undo2
  if (modifier === "sharp left" || modifier === "left") return CornerUpLeft
  if (modifier === "sharp right" || modifier === "right") return CornerUpRight
  if (modifier === "slight left") return ArrowUpLeft
  if (modifier === "slight right") return ArrowUpRight
  return ArrowUp
}

interface NavigationOverlayProps {
  route: DirectionsRoute
  progress: RouteProgress | null
  status: NavigationStatus
  error: string | null
  destinationLabel: string
  muted: boolean
  following: boolean
  onToggleMute: () => void
  onRecenter: () => void
  onExit: () => void
  onFinish: () => void
}

export function NavigationOverlay({
  route,
  progress,
  status,
  error,
  destinationLabel,
  muted,
  following,
  onToggleMute,
  onRecenter,
  onExit,
  onFinish,
}: NavigationOverlayProps) {
  const nextStep = progress ? route.steps[progress.nextStepIndex] : undefined
  const thenStep = progress ? route.steps[progress.nextStepIndex + 1] : undefined
  const ManeuverIcon = getManeuverIcon(nextStep?.maneuver)
  const ThenIcon = getManeuverIcon(thenStep?.maneuver)
  const arrived = status === "arrived"

  // Before the first GPS fix, show the whole-trip figures
  const remainingDuration = progress?.remainingDuration ?? route.duration
  const remainingDistance = progress?.remainingDistance ?? route.distance

  return (
    <>
      {/* Next maneuver */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:right-auto lg:w-[420px]">
        <div className="pointer-events-auto overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-xl" aria-live="polite">
          {status === "locating" || status === "error" ? (
            <div className="flex items-center gap-3 p-4">
              {status === "error" ? (
                <MapPinOff className="h-8 w-8 shrink-0" />
              ) : (
                <Loader2 className="h-8 w-8 shrink-0 animate-spin" />
              )}
              <p className="text-lg font-semibold leading-snug">
                {status === "error" ? error : "Getting your location…"}
              </p>
            </div>
          ) : arrived ? (
            <div className="flex items-center gap-4 p-4">
              <Flag className="h-10 w-10 shrink-0" />
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-tight">You have arrived</p>
                <p className="truncate text-base text-primary-foreground/85">{destinationLabel}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 p-4">
                <ManeuverIcon className="h-11 w-11 shrink-0" strokeWidth={2.5} />
                <div className="min-w-0">
                  {progress && (
                    <p className="text-3xl font-bold leading-none tabular-nums">
                      {formatNavDistance(progress.distanceToManeuver)}
                    </p>
                  )}
                  <p className="mt-1 text-lg font-medium leading-snug">{nextStep?.instruction}</p>
                </div>
              </div>
              {(status === "rerouting" || thenStep) && (
                <div className="flex items-center gap-2 bg-black/15 px-4 py-2 text-sm font-medium">
                  {status === "rerouting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Rerouting…
                    </>
                  ) : (
                    <>
                      Then <ThenIcon className="h-4 w-4" strokeWidth={2.5} />
                      <span className="truncate font-normal text-primary-foreground/85">{thenStep?.instruction}</span>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Trip summary */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-start gap-3 lg:bottom-4 lg:left-4 lg:right-auto lg:w-[420px]">
        {!following && !arrived && (
          <button
            type="button"
            onClick={onRecenter}
            className="pointer-events-auto ml-3 flex h-11 items-center gap-2 rounded-full bg-background px-4 text-sm font-semibold text-primary shadow-lg lg:ml-0"
          >
            <LocateFixed className="h-4 w-4" /> Re-center
          </button>
        )}

        <div className="pointer-events-auto flex w-full items-center gap-3 rounded-t-3xl bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] lg:rounded-2xl lg:pb-4 lg:shadow-xl">
          {arrived ? (
            <>
              <p className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">{destinationLabel}</p>
              <Button onClick={onFinish} size="lg">
                Done
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? "Unmute voice guidance" : "Mute voice guidance"}
                aria-pressed={muted}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border transition-colors",
                  muted ? "bg-muted text-muted-foreground" : "text-primary hover:bg-muted",
                )}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="text-2xl font-bold leading-tight text-primary tabular-nums">
                  {formatDuration(remainingDuration)}
                </p>
                <p className="truncate text-sm text-muted-foreground tabular-nums">
                  {formatDistance(remainingDistance)} · {formatArrivalTime(remainingDuration)}
                </p>
              </div>

              <button
                type="button"
                onClick={onExit}
                aria-label="Exit navigation"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
