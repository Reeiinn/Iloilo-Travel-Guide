import type { MetadataRoute } from 'next'

// Every page is public and guest-accessible, so let search engines crawl the whole app
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
  }
}
