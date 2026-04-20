import type { GeocodeResult } from '@/lib/api/geocode'

const STORAGE_KEY = 'safesite_search_history'
const MAX_HISTORY = 10

export function loadHistory(): GeocodeResult[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GeocodeResult[]) : []
  } catch {
    return []
  }
}

export function saveToHistory(result: GeocodeResult): void {
  if (typeof window === 'undefined') return
  const prev = loadHistory()
  const filtered = prev.filter((r) => r.address !== result.address)
  const next = [result, ...filtered].slice(0, MAX_HISTORY)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
