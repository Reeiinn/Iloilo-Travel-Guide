"use client"

import { useState } from "react"
import { ChevronRight, CircleHelp, Users } from "lucide-react"
import { AboutUsModal } from "@/components/about-us-modal"
import { FaqList } from "@/components/faq-list"
import { PageHeader } from "@/components/page-header"

export default function HelpPage() {
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-8 pt-5 lg:pt-8">
      <PageHeader title="Help & FAQs" description="Answers to common questions about iLOcate." />

      <section className="rounded-3xl bg-card px-4 shadow-sm sm:px-5">
        <FaqList />
      </section>

      <button
        type="button"
        onClick={() => setAboutOpen(true)}
        className="flex min-h-16 w-full items-center gap-3 rounded-3xl bg-card px-4 text-left shadow-sm transition-colors hover:bg-muted/60"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">About iLOcate</span>
          <span className="block text-xs text-muted-foreground">Meet the team behind the app</span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground">
        <CircleHelp className="h-3.5 w-3.5" /> iLOcate · Explore Iloilo Now!
      </p>

      <AboutUsModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  )
}
