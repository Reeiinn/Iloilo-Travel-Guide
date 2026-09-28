const PREFERENCES_STORAGE_KEY = "ilocate-user-preferences"

export function getUserPreferences(): string[] {
  if (typeof window === "undefined") return []

  try {
    const saved = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    const parsed: unknown = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

export function saveUserPreferences(preferences: string[]): void {
  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Keep the app usable when browser storage is unavailable.
  }
}