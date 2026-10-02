"use client"

import { useState } from "react"
import { ArrowRightLeft, Check, Copy, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"

const sampleTranslations: Record<string, string> = {
  "hello": "Kamusta",
  "thank you": "Salamat",
  "how much is this": "Tag-pila ini?",
  "where is": "Diin ang",
  "good morning": "Maayong aga",
  "good evening": "Maayong gab-i",
  "delicious": "Namit",
  "beautiful": "Matahum",
  "i love iloilo": "Palangga ko ang Iloilo",
  "excuse me": "Palihog",
}

const languages = ["English", "Ilonggo", "Filipino"]
// Browsers have no Ilonggo voice; a Filipino voice reads it closest to how it sounds
const speechLang: Record<string, string> = { English: "en-US", Ilonggo: "fil-PH", Filipino: "fil-PH" }
const charLimit = 500

export default function TranslatorPage() {
  const [fromLang, setFromLang] = useState("English")
  const [toLang, setToLang] = useState("Ilonggo")
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [copied, setCopied] = useState(false)

  const swapLanguages = () => {
    setFromLang(toLang)
    setToLang(fromLang)
    setInputText(outputText)
    setOutputText(inputText)
  }

  const translate = (text: string) => {
    const key = text.toLowerCase().trim()
    setOutputText(sampleTranslations[key] ?? `[Translation of "${text}" to ${toLang}]`)
  }

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (e.g. non-HTTPS); nothing else to do
    }
  }

  const speakOutput = () => {
    if (!("speechSynthesis" in window)) return
    const utterance = new SpeechSynthesisUtterance(outputText)
    utterance.lang = speechLang[toLang] ?? "en-US"
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const selectClass =
    "min-h-11 w-full appearance-none rounded-xl bg-secondary px-3 text-center text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 md:text-sm"

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-5 lg:pt-8">
      <PageHeader title="Translator" description="Talk with locals in Ilonggo (Hiligaynon)." />

      <div className="rounded-3xl bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="from-lang" className="sr-only">From language</label>
          <select id="from-lang" value={fromLang} onChange={(e) => setFromLang(e.target.value)} className={selectClass}>
            {languages.map((lang) => (
              <option key={lang}>{lang}</option>
            ))}
          </select>
          <Button variant="ghost" size="icon" onClick={swapLanguages} aria-label="Swap languages" className="shrink-0 rounded-full">
            <ArrowRightLeft />
          </Button>
          <label htmlFor="to-lang" className="sr-only">To language</label>
          <select id="to-lang" value={toLang} onChange={(e) => setToLang(e.target.value)} className={selectClass}>
            {languages.map((lang) => (
              <option key={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label htmlFor="translate-input" className="sr-only">Text to translate</label>
          <textarea
            id="translate-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, charLimit))}
            onKeyDown={(e) => {
              // Ctrl/Cmd+Enter translates; plain Enter still adds a new line
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && inputText.trim()) {
                e.preventDefault()
                translate(inputText)
              }
            }}
            placeholder="Type something…"
            rows={4}
            className="w-full resize-none rounded-2xl border border-input bg-background p-4 pb-10 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-muted-foreground">
            {inputText.length}/{charLimit}
          </span>
        </div>

        <Button onClick={() => translate(inputText)} disabled={!inputText.trim()} size="lg" className="mt-3 w-full">
          Translate
        </Button>

        <div className="mt-4 rounded-2xl bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">{toLang}</span>
            <div className="-mr-2 flex items-center">
              <Button variant="ghost" size="icon" onClick={copyOutput} disabled={!outputText} aria-label="Copy translation">
                {copied ? <Check className="text-primary" /> : <Copy />}
              </Button>
              <Button variant="ghost" size="icon" onClick={speakOutput} disabled={!outputText} aria-label="Listen to translation">
                <Volume2 />
              </Button>
            </div>
          </div>
          <p className="min-h-12 text-lg font-medium text-foreground">
            {outputText || <span className="text-base font-normal text-muted-foreground">Translation will appear here</span>}
          </p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-bold text-foreground">Common phrases</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(sampleTranslations).map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => {
                setFromLang("English")
                setToLang("Ilonggo")
                setInputText(phrase)
                translate(phrase)
              }}
              className="min-h-10 rounded-full border border-border bg-card px-4 text-sm capitalize text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {phrase}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
