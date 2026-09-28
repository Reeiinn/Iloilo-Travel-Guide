import Image from "next/image"
import { MapPin, Star } from "lucide-react"

interface ListingCardProps {
  name: string
  location: string
  description: string
  price: string
  image: string
  rating?: number
  category?: string
  priority?: boolean
}

export function ListingCard({
  name,
  location,
  description,
  price,
  image,
  rating = 4.5,
  category,
  priority = false,
}: ListingCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {category && (
          <div className="absolute right-3 top-3 rounded-lg bg-card/90 px-2.5 py-1 text-sm font-medium text-foreground backdrop-blur-sm">
            {category}
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="text-sm font-medium text-foreground">{rating}</span>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          {location}
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-primary">{price}</span>
          <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
            View Details &rarr;
          </span>
        </div>
      </div>
    </div>
  )
}
