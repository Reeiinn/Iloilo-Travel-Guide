import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-secondary px-6 text-center">
      <Image src="/logo black line.svg" alt="" width={64} height={64} className="h-16 w-16 object-contain" />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page took a wrong jeepney. Head back home to keep exploring Iloilo.
      </p>
      <Button asChild size="lg" className="mt-2">
        <Link href="/dashboard">Back to Home</Link>
      </Button>
    </div>
  )
}
