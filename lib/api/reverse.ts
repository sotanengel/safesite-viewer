/**
 * Reverse geocoding logic - calls the GSI reverse geocoder API.
 * Lambda-migration-ready.
 */

export interface ReverseGeocodeResult {
  address: string
  lat: number
  lng: number
}

interface GsiReverseItem {
  results: {
    muniCd: string
    lv01Nm: string
    lv02Nm?: string
    lv03Nm?: string
    lv04Nm?: string
  } | null
}

/**
 * Reverse geocode using GSI (国土地理院) reverse geocoder.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  const url = new URL('https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })

  if (!res.ok) return null

  const data: GsiReverseItem = await res.json()
  if (!data.results) return null

  const r = data.results
  const addressParts = [r.lv01Nm, r.lv02Nm, r.lv03Nm, r.lv04Nm].filter(Boolean)
  const address = addressParts.join('')

  return { address, lat, lng }
}
