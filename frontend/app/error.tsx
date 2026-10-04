"use client" // Error boundaries must be Client Components

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-secondary px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        iLOcate hit an unexpected error. Try again, or go back to Home.
      </p>
      <div className="mt-2 flex gap-2">
        <Button size="lg" onClick={() => unstable_retry()}>
          Try again
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard">Home</Link>
        </Button>
      </div>
    </div>
  )
}
