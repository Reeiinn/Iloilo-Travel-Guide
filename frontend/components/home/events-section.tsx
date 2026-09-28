"use client"

import Image from "next/image"
import { useRef } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

const events = [
  {
    id: 1,
    name: "Dinagyang Festival",
    date: "January 26, 2026",
    description: "One of the grandest and most colorful festivals in the Philippines celebrating the Santo Nino.",
    image: "/images/events/dinagyang-festival.jpg",
  },
  {
    id: 2,
    name: "Paraw Regatta",
    date: "February 15, 2026",
    description: "A traditional sailboat race showcasing Iloilo's rich maritime heritage and culture.",
    image: "/images/events/paraw-regatta.jpg",
  },
  {
    id: 3,
    name: "Iloilo Food Festival",
    date: "March 20, 2026",
    description: "A celebration of Ilonggo cuisine featuring local delicacies and culinary talents.",
    image: "/images/food/Local Food/food-festival.jpg",
  },
  {
    id: 4,
    name: "Heritage Walk",
    date: "April 10, 2026",
    description: "A guided walking tour through Iloilo's historic Calle Real district and colonial buildings.",
    image: "/images/places/Attractions/esplanade.jpg",
  },
]

export function EventsSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 340
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <section className="bg-background py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Upcoming</p>
            <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
              Events & Festivals
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
              Experience the vibrant culture and traditions of Iloilo through its exciting events.
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => scroll("left")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
              aria-label="Scroll events left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
              aria-label="Scroll events right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {events.map((event) => (
            <div
              key={event.id}
              className="group min-w-[280px] flex-shrink-0 overflow-hidden rounded-2xl bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:min-w-[320px]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="320px"
                />
                {/* Date Badge */}
                <div className="absolute left-3 top-3 rounded-lg bg-primary px-3 py-1.5 shadow-md">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary-foreground" />
                    <span className="text-sm font-semibold text-primary-foreground">{event.date}</span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-foreground">{event.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
