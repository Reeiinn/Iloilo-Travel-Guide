import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'iLOcate - Explore Iloilo Now!',
  description: 'Discover the best places, food, events, and experiences in Iloilo City, Philippines. Your ultimate tourism discovery platform.',
  applicationName: 'iLOcate',
  appleWebApp: {
    capable: true,
    title: 'iLOcate',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      {
        url: '/Icon-Ilocate-Light.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/Ilocate-Icon-Dark.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
  // Lets the app draw under the notch / home indicator; layouts pad with env(safe-area-inset-*)
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}