/**
 * Summary API logic - aggregates hazard data for a given location.
 * Lambda-migration-ready: no Next.js-specific imports.
 */

export type Severity = 'safe' | 'caution' | 'warning' | 'danger' | 'unknown'

export interface HazardSummary {
  flood: { severity: Severity; label: string }
  tsunami: { severity: Severity; label: string }
  earthquake: { prob30y: number | null; severity: Severity; label: string }
  landslide: { severity: Severity; label: string }
}

export interface SummaryResponse {
  lat: number
  lng: number
  hazards: HazardSummary
  sources: string[]
}

// ── J-SHIS API ──────────────────────────────────────────────────────────────

interface JshisResponse {
  MESHCODE: string
  PROB_60_50: string  // 50-year probability of seismic intensity ≥ 6-weak (%)
}

async function fetchJshisEarthquakeProb(lat: number, lng: number): Promise<number | null> {
  try {
    const url = new URL('https://api.j-shis.bosai.go.jp/map/pshm/v2/interpolate/mesh500/result.json')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('outtype', 'JSON')

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return null
    const data: JshisResponse = await res.json()
    const prob = parseFloat(data.PROB_60_50)
    return isNaN(prob) ? null : prob
  } catch {
    return null
  }
}

function earthquakeSeverity(prob: number | null): Severity {
  if (prob === null) return 'unknown'
  if (prob < 3) return 'safe'
  if (prob < 10) return 'caution'
  if (prob < 26) return 'warning'
  return 'danger'
}

// ── Flood / Tsunami / Landslide ──────────────────────────────────────────────
// Phase 1: We use raster tile data for display, so severity is derived from
// the tile URL existence rather than point query. For the summary panel,
// we provide a link to the portal for the user to check.
// A proper point-in-polygon query against GeoJSON would be Phase 2.

function unknownHazard(label: string): { severity: Severity; label: string } {
  return { severity: 'unknown', label }
}

// ── Main ─────────────────────────────────────────────────────────────────────

export async function getSummary(lat: number, lng: number): Promise<SummaryResponse> {
  const earthquakeProb = await fetchJshisEarthquakeProb(lat, lng)
  const eqSeverity = earthquakeSeverity(earthquakeProb)
  const eqLabel =
    earthquakeProb !== null
      ? `30年以内に震度6弱以上: ${earthquakeProb.toFixed(1)}%`
      : '取得できませんでした'

  return {
    lat,
    lng,
    hazards: {
      flood: unknownHazard('洪水浸水想定データを地図でご確認ください'),
      tsunami: unknownHazard('津波浸水想定データを地図でご確認ください'),
      earthquake: { prob30y: earthquakeProb, severity: eqSeverity, label: eqLabel },
      landslide: unknownHazard('土砂災害警戒区域データを地図でご確認ください'),
    },
    sources: [
      'J-SHIS（防災科学技術研究所）',
      'ハザードマップポータルサイト（国土交通省）',
    ],
  }
}
