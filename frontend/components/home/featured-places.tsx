import Image from "next/image"
import Link from "next/link"
import { MapPin } from "lucide-react"

const places = [
  {
    id: 1,
    name: "Miag-ao Church",
    location: "Miag-ao, Iloilo",
    description: "A UNESCO World Heritage Site featuring stunning Baroque Romanesque architecture with intricate stone carvings.",
    price: "Free Admission",
    image: "/images/places/Churches/miagao-church.jpg",
  },
  {
    id: 2,
    name: "Islas de Gigantes",
    location: "Carles, Iloilo",
    description: "A breathtaking island group with crystal-clear waters, white sand beaches, and dramatic rock formations.",
    price: "From PHP 2,500",
    image: "/images/places/Attractions/gigantes-island.jpg",
  },
  {
    id: 3,
    name: "Garin Farm",
    location: "San Joaquin, Iloilo",
    description: "A pilgrimage resort featuring the famous stairway to heaven with panoramic views of Iloilo.",
    price: "From PHP 350",
    image: "/images/places/Attractions/garin-farm.jpg",
  },
]

export function FeaturedPlaces() {
  return (
    <section className="bg-secondary py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-medium text-primary">Top Destinations</p>
          <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
            Featured Places
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">
            Explore the most popular destinations in Iloilo, handpicked by locals and loved by travelers from around the world.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <Link
              key={place.id}
              href="/places"
              className="group overflow-hidden rounded-2xl bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={place.image}
                  alt={place.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-foreground">{place.name}</h3>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {place.location}
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {place.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">{place.price}</span>
                  <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                    View Details &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
