"use client"

import { cn } from "@/lib/utils"

/** A single-row, swipeable set of filter chips (wraps on desktop). */
export function CategoryChips({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
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
            onClick={() => onChange(option)}
            className={cn(
              "min-h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
