import { Building2, Church, Coffee, Landmark, ShoppingBag, UtensilsCrossed, Waves } from "lucide-react"

/** Interests offered on the welcome screen and in Profile. Ids are what gets saved in preferences. */
export const INTEREST_CATEGORIES = [
  { id: "coffee-shops", label: "Coffee Shops", icon: Coffee },
  { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { id: "beaches", label: "Beaches", icon: Waves },
  { id: "churches", label: "Churches", icon: Church },
  { id: "malls", label: "Malls", icon: ShoppingBag },
  { id: "city-landmarks", label: "Landmarks", icon: Landmark },
  { id: "museums", label: "Museums", icon: Building2 },
] as const
