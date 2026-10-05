"use client"

import { cn } from "@/lib/utils"

/** A single-row, swipeable set of filter chips (wraps on desktop). */
export function CategoryChips({
  options,
  value,
  onChange,
  counts,
  className,
}: {
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  /** Optional number shown after each label, keyed by option */
  counts?: Record<string, number>
  className?: string
}) {
  // Tabs move with the arrow keys (only the active chip is in the tab order)
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = options[(options.indexOf(value) + step + options.length) % options.length]
    onChange(next)
    const target = event.currentTarget.querySelector<HTMLButtonElement>(`[data-option="${CSS.escape(next)}"]`)
    target?.focus()
    target?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      aria-label="Filter by category"
      className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:flex-wrap md:px-0", className)}
    >
      {options.map((option) => {
        const active = option === value
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            data-option={option}
            onClick={() => onChange(option)}
            className={cn(
              "min-h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {option}
            {counts?.[option] !== undefined && (
              <span className={cn("ml-1.5 text-xs", active ? "text-primary-foreground/80" : "text-muted-foreground/80")}>
                {counts[option]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
