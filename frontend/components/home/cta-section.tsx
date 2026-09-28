import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="bg-background px-4 pb-16 md:pb-24">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-[#0B3E42] px-6 py-12 text-center md:px-12 md:py-16">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl">Ready to explore Iloilo?</h2>
        <p className="mx-auto mt-3 max-w-md text-pretty text-white/80">
          Explore routes, discover places, and save your interests on this device.
        </p>
        <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="bg-white text-base text-primary hover:bg-white/90">
            <Link href="/dashboard">
              Explore Iloilo <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-base text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/preferences">Choose interests</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
