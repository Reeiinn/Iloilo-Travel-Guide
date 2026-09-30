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
    question: "Does the map work offline?",
    answer: "Not yet. The map and directions need an internet connection.",
  },
]

export function FaqList() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/60 last:border-b-0">
          <AccordionTrigger className="min-h-14 py-4 text-left text-sm font-semibold text-foreground hover:text-primary hover:no-underline">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
