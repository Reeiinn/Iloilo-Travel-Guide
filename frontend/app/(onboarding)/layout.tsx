export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-secondary sm:flex sm:items-center sm:justify-center sm:py-8">
      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background sm:h-[min(860px,calc(100dvh-4rem))] sm:min-h-0 sm:overflow-hidden sm:rounded-[2rem] sm:shadow-xl">
        {children}
      </main>
    </div>
  )
}
