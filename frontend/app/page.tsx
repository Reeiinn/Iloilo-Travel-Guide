"use client"

import { useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { hasCompletedOnboarding } from "@/lib/preferences"

// App launch screen: first-time users go to the welcome flow, everyone else straight to Home
export default function LaunchPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(hasCompletedOnboarding() ? "/dashboard" : "/preferences")
  }, [router])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background">
      <Image src="/logo black line.svg" alt="" width={72} height={72} priority className="h-18 w-18 animate-pulse object-contain" />
      <span className="text-2xl font-bold tracking-tight text-foreground">
        iLO<span className="text-primary">cate</span>
      </span>
    </div>
  )
}
