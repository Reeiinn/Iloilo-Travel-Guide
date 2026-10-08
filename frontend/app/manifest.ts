import type { MetadataRoute } from 'next'

// Lets phones "Add to Home Screen" and open iLOcate like a native app
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'iLOcate - Explore Iloilo',
    short_name: 'iLOcate',
    description: 'Jeepney routes, directions, places and food in Iloilo City.',
    id: '/',
    start_url: '/',
    scope: '/',
    lang: 'en',
    categories: ['travel', 'navigation'],
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFFFFF',
    theme_color: '#FFFFFF',
    icons: [
      {
        src: '/Icon-Ilocate-Light.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
