/**
 * Geocoding logic - calls the GSI address search API.
 * This module is Lambda-migration-ready: no Next.js-specific imports.
 * When migrating to Lambda, wrap this in a thin API Gateway handler adapter.
 */

export interface GeocodeResult {
  address: string
  lat: number
  lng: number
  score: number
  /** Prefecture + municipality for display */
  municipality?: string
}

interface GsiAddressItem {
  geometry: { coordinates: [number, number]; type: 'Point' }
  properties: {
    addressCode: string
    title: string
    score: number
    muniCd: string
    lv01Nm: string
  }
  type: 'Feature'
}

/**
 * Search addresses using GSI (国土地理院) Geocoding API.
 * Free, no API key required.
 */
export async function geocode(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return []

  const url = new URL('https://msearch.gsi.go.jp/address-search/AddressSearch')
  url.searchParams.set('q', query)

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })

  if (!res.ok) {
    throw new Error(`GSI geocode error: ${res.status}`)
  }

  const items: GsiAddressItem[] = await res.json()

  return items.slice(0, 5).map((item) => ({
    address: item.properties.title,
    lat: item.geometry.coordinates[1],
    lng: item.geometry.coordinates[0],
    score: item.properties.score,
    municipality: item.properties.lv01Nm,
  }))
}
