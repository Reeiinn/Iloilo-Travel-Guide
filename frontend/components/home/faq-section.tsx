"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is iLOcate?",
    answer:
      "iLOcate is a navigation and discovery app for Iloilo City, Philippines. It shows jeepney (PUJ) routes, gives directions, and helps you find places, food and experiences around the city.",
  },
  {
    question: "Is iLOcate free to use?",
    answer:
      "Yes. Routes, directions, places, the itinerary planner and the translator are free, and no account is required. Likes and interests are saved only in this browser.",
  },
  {
    question: "How do I find which jeepney to ride?",
    answer:
      "Open the Map tab and search where you want to go, or browse the list of PUJ routes to see each route and its stops in both directions.",
  },
  {
    question: "Can I install iLOcate on my phone?",
    answer:
      "Yes. Open iLOcate in your phone's browser and choose \"Add to Home Screen\" (Safari share menu on iPhone, or the ⋮ menu in Chrome on Android). It opens full screen like a regular app.",
  },
  {
    question: "Does the map work offline?",
    answer: "Not yet. The map and directions need an internet connection.",
  },
]

export function FaqSection() {
  return (
    <section id="faqs" className="scroll-mt-20 bg-background py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 lg:px-6">
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-2 text-sm font-semibold text-primary">Support</p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
              <AccordionTrigger className="min-h-14 py-4 text-left text-base font-semibold text-foreground hover:text-primary hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
