const PREFERENCES_STORAGE_KEY = "ilocate-user-preferences"
const ONBOARDED_STORAGE_KEY = "ilocate-onboarded"

export function getUserPreferences(): string[] {
  if (typeof window === "undefined") return []

  try {
    const saved = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    const parsed: unknown = saved ? JSON.parse(saved) : []
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((item): item is string => typeof item === "string"))]
  } catch {
    return []
  }
}

export function saveUserPreferences(preferences: string[]): void {
  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify([...new Set(preferences)]))
  } catch {
    // Keep the app usable when browser storage is unavailable.
  }
}

// First launch shows the welcome/interests screen; after that the app opens straight to Home
export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return false

  try {
    return (
      window.localStorage.getItem(ONBOARDED_STORAGE_KEY) === "1" ||
      window.localStorage.getItem(PREFERENCES_STORAGE_KEY) !== null
    )
  } catch {
    return true
  }
}

export function markOnboardingComplete(): void {
  try {
    window.localStorage.setItem(ONBOARDED_STORAGE_KEY, "1")
  } catch {
    // Keep the app usable when browser storage is unavailable.
  }
}
