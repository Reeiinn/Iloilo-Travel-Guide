"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Accounts live in this browser's localStorage, like likes and interests.
 * Passwords are never stored: only a salted PBKDF2 hash. There is no server, so an
 * account exists on this device only; swap these functions for API calls to sync accounts.
 */

export type AuthUser = {
  id: string
  name: string
  email: string
  createdAt: string
}

type StoredAccount = AuthUser & {
  salt: string
  passwordHash: string
}

const ACCOUNTS_STORAGE_KEY = "ilocate-accounts"
const SESSION_STORAGE_KEY = "ilocate-session"
const AUTH_UPDATED_EVENT = "ilocate-auth-updated"
const PBKDF2_ITERATIONS = 100_000

export const MIN_PASSWORD_LENGTH = 8

export class AuthError extends Error {}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

function toHex(bytes: ArrayBuffer | Uint8Array) {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("")
}

async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: PBKDF2_ITERATIONS },
    key,
    256,
  )
  return toHex(bits)
}

function readAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(ACCOUNTS_STORAGE_KEY) ?? "[]")
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : []
  } catch {
    return []
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  try {
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))
  } catch {
    throw new AuthError("Couldn't save your account. Check that this browser allows site storage.")
  }
}

function setSession(userId: string | null) {
  try {
    if (userId) window.localStorage.setItem(SESSION_STORAGE_KEY, userId)
    else window.localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Storage can be blocked (private mode); the user just won't stay signed in
  }
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT))
}

function publicUser({ id, name, email, createdAt }: StoredAccount): AuthUser {
  return { id, name, email, createdAt }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const userId = window.localStorage.getItem(SESSION_STORAGE_KEY)
    const account = userId ? readAccounts().find((a) => a.id === userId) : undefined
    return account ? publicUser(account) : null
  } catch {
    return null
  }
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<AuthUser> {
  const name = input.name.trim()
  const email = normalizeEmail(input.email)
  if (!name) throw new AuthError("Enter your name.")
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AuthError("Enter a valid email address.")
  if (input.password.length < MIN_PASSWORD_LENGTH)
    throw new AuthError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`)

  const accounts = readAccounts()
  if (accounts.some((a) => a.email === email)) throw new AuthError("An account with this email already exists. Sign in instead.")

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const account: StoredAccount = {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date().toISOString(),
    salt,
    passwordHash: await hashPassword(input.password, salt),
  }
  writeAccounts([...accounts, account])
  setSession(account.id)
  return publicUser(account)
}

export async function signIn(input: { email: string; password: string }): Promise<AuthUser> {
  const email = normalizeEmail(input.email)
  const account = readAccounts().find((a) => a.email === email)
  // Same message for unknown email and wrong password
  if (!account || (await hashPassword(input.password, account.salt)) !== account.passwordHash)
    throw new AuthError("Incorrect email or password.")

  setSession(account.id)
  return publicUser(account)
}

export function signOut() {
  setSession(null)
}

/** Only allow same-site paths as a post-sign-in destination. */
export function safeRedirect(next: string | undefined | null, fallback = "/dashboard") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback
}

/** Current signed-in user, kept in sync across pages and tabs. `ready` is false until storage has been read. */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => {
      setUser(getCurrentUser())
      setReady(true)
    }
    sync()
    window.addEventListener("storage", sync)
    window.addEventListener(AUTH_UPDATED_EVENT, sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener(AUTH_UPDATED_EVENT, sync)
    }
  }, [])

  const logOut = useCallback(() => signOut(), [])

  return { user, ready, signIn, signUp, logOut }
}
