import { Map, SlidersHorizontal, Compass } from "lucide-react"

const steps = [
  {
    icon: Map,
    title: "Open the explorer",
    description: "Browse routes and places right away. No account required.",
  },
  {
    icon: SlidersHorizontal,
    title: "Pick your interests",
    description: "Choose interests to personalize recommendations saved in this browser.",
  },
  {
    icon: Compass,
    title: "Go explore",
    description: "Search a destination, follow the route, and discover hidden gems along the way.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-secondary py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-6">
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-2 text-sm font-semibold text-primary">Getting started</p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
            Start your Iloilo adventure in three easy steps.
          </p>
        </div>

        <ol className="mx-auto grid max-w-md gap-4 md:max-w-none md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-3xl bg-card p-5 shadow-sm md:flex-col md:items-center md:p-8 md:text-center">
              <div className="relative shrink-0">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <step.icon className="h-7 w-7 text-primary" />
                </span>
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground md:mt-2">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
