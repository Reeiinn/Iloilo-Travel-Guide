import { Bus, Heart, Languages, CalendarDays, Navigation, Utensils } from "lucide-react"

const features = [
  {
    icon: Bus,
    title: "Jeepney routes",
    description: "See every PUJ route on the map, with stops in both directions.",
  },
  {
    icon: Navigation,
    title: "Directions",
    description: "Get a route from where you are to any landmark, or drop a pin anywhere.",
  },
  {
    icon: Utensils,
    title: "Places & food",
    description: "Churches, museums, beaches, cafes and batchoy spots, all in one list.",
  },
  {
    icon: Heart,
    title: "Picked for you",
    description: "Tell us what you like and get recommendations that match.",
  },
  {
    icon: CalendarDays,
    title: "Itinerary planner",
    description: "Lay out your days and get a rough budget for the trip.",
  },
  {
    icon: Languages,
    title: "Ilonggo translator",
    description: "Common phrases to say hello, ask for directions and order food.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-background py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-6">
        <div className="mb-10 max-w-2xl md:mb-14">
          <p className="mb-2 text-sm font-semibold text-primary">Everything you need, free</p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            One app for getting around Iloilo
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Built for tourists and locals who just want to know which jeep to ride and where to go next.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex gap-4 rounded-3xl border border-border/70 bg-card p-5 sm:flex-col">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
