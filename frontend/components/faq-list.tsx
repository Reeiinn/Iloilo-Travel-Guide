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
      "Yes. Routes, directions, places, food and the translator are free, and no account is required. Likes and interests are saved only in this browser.",
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
    question: "How much is a jeepney fare in Iloilo?",
    answer:
      "Most trips within the city cost about PHP 10–30 depending on distance. Fares shown in iLOcate are estimates, so check the fare matrix posted inside the jeepney.",
  },
  {
    question: "How do I save a place for later?",
    answer:
      "Tap the heart on any place or food card. Everything you like is listed under Profile, and it stays saved in this browser.",
  },
  {
    question: "How do I change my interests?",
    answer: "Go to Profile, tap the interests you want, then tap Save interests. Home will pick recommendations to match.",
  },
  {
    question: "Does the map work offline?",
    answer: "Not yet. The map and directions need an internet connection.",
  },
]

export function FaqList() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq) => (
        <AccordionItem key={faq.question} value={faq.question} className="border-b border-border/60 last:border-b-0">
          <AccordionTrigger className="min-h-14 py-4 text-left text-sm font-semibold text-foreground hover:text-primary hover:no-underline">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
