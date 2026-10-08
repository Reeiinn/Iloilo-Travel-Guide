"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthError, MIN_PASSWORD_LENGTH, getCurrentUser, safeRedirect, signIn, signUp } from "@/lib/auth"
import { markOnboardingComplete } from "@/lib/preferences"
import { cn } from "@/lib/utils"

type Mode = "login" | "signup"

const copy = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to see your profile, likes, and interests.",
    submit: "Sign in",
    submitting: "Signing in…",
    switchPrompt: "New to iLOcate?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your account",
    subtitle: "Keep your likes and interests under your own profile.",
    submit: "Create account",
    submitting: "Creating account…",
    switchPrompt: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/login",
  },
} satisfies Record<Mode, Record<string, string>>

function Field({
  id,
  label,
  icon: Icon,
  trailing,
  ...inputProps
}: { id: string; label: string; icon: typeof Mail; trailing?: React.ReactNode } & React.ComponentProps<"input">) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          name={id}
          className={cn(
            "h-12 w-full rounded-2xl border border-input bg-background pl-10 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 sm:text-sm",
            trailing ? "pr-12" : "pr-4",
          )}
          {...inputProps}
        />
        {trailing}
      </div>
    </div>
  )
}

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter()
  const text = copy[mode]
  const destination = safeRedirect(next)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in: skip the form
  useEffect(() => {
    if (getCurrentUser()) router.replace(destination)
  }, [router, destination])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === "signup") await signUp({ name, email, password })
      else await signIn({ email, password })
      markOnboardingComplete()
      router.replace(destination)
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  // Keep ?next= when switching between sign in and create account
  const switchHref = next ? `${text.switchHref}?next=${encodeURIComponent(destination)}` : text.switchHref

  return (
    <div className="flex flex-1 flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))] sm:px-8 sm:py-10">
      <Link href="/dashboard" className="flex items-center self-start" aria-label="iLOcate home">
        <Image src="/logo black line.svg" alt="" width={40} height={40} className="-ml-1 h-10 w-10 object-contain" />
        <span className="text-xl font-bold tracking-tight text-foreground">
          iLO<span className="text-primary">cate</span>
        </span>
      </Link>

      <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-foreground">{text.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {mode === "signup" && (
          <Field
            id="name"
            label="Name"
            icon={User}
            type="text"
            autoComplete="name"
            placeholder="Juan dela Cruz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <Field
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          id="password"
          label="Password"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder={mode === "signup" ? `At least ${MIN_PASSWORD_LENGTH} characters` : "Your password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full rounded-2xl text-base font-semibold">
          {submitting && <Loader2 className="animate-spin" />}
          {submitting ? text.submitting : text.submit}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {text.switchPrompt}{" "}
        <Link href={switchHref} className="font-semibold text-primary hover:underline">
          {text.switchLabel}
        </Link>
      </p>

      <div className="mt-auto pt-8 text-center">
        <Link
          href={destination}
          className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Continue as guest
        </Link>
        <p className="text-xs text-muted-foreground">Your account is saved in this browser on this device.</p>
      </div>
    </div>
  )
}
