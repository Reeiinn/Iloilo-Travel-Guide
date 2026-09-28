import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden">
      {/* Left: Image */}
      <div className="relative hidden h-full w-1/2 overflow-hidden lg:block">
        <Image
          src="/images/banners/hero-iloilo.svg"
          alt="Beautiful Iloilo scenery"
          fill
          className="object-cover scale-150"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/30 to-black/50" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link href="/" className="flex items-center gap-0">
            <Image
                        src="/Ilocate No BG.svg"
                        alt="iLOcate logo"
                        width={80}
                        height={70}
                        className="object-contain"
            />
            <span className={`-ml-1 text-2xl md:text-3xl font-bold tracking-tight text-white`}>
              iLO<span className="text-primary-foreground">cate</span>
            </span>
          </Link>
          <div>
            <h2 className="text-balance text-3xl font-bold leading-tight text-white">
              Discover the beauty of Iloilo
            </h2>
            <p className="mt-3 max-w-sm text-pretty text-sm leading-relaxed text-white/80">
              Join thousands of explorers finding the best places, foods, and experiences in the City of Love.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex w-full min-h-0 flex-col lg:w-1/2">
        <div className="flex items-center px-4 pb-2 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 lg:hidden">
          <Link href="/" className="flex items-center" aria-label="iLOcate home">
            <Image src="/logo black line.svg" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              iLO<span className="text-primary">cate</span>
            </span>
          </Link>
        </div>
        <main className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-6 sm:px-6 lg:items-center lg:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
