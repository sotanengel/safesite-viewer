/**
 * Layer configuration for SafeSite Viewer.
 * Each layer definition describes its data source, type, and display properties.
 */

export type LayerCategory = 'hazard' | 'terrain' | 'location'
export type LayerDataType = 'raster-tile' | 'geojson'

export interface LayerDef {
  id: string
  label: string
  category: LayerCategory
  dataType: LayerDataType
  /** For raster-tile layers */
  tileUrl?: string
  /** For GeoJSON layers */
  geojsonUrl?: string
  attribution: string
  defaultOpacity: number
  defaultVisible: boolean
  /** Color used in legend and GeoJSON fill/stroke */
  color: string
  priority: 'must' | 'should' | 'could'
}

// ──────────────────────────────────────────────
// Hazard layers (Must priority for Phase 1)
// ──────────────────────────────────────────────

export const LAYERS: LayerDef[] = [
  // --- Flood ---
  {
    id: 'flood-max',
    label: '洪水浸水想定（想定最大規模）',
    category: 'hazard',
    dataType: 'raster-tile',
    tileUrl: 'https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png',
    attribution: '<a href="https://disaportal.gsi.go.jp/" target="_blank">ハザードマップポータルサイト（国土交通省）</a>',
    defaultOpacity: 0.6,
    defaultVisible: true,
    color: '#3b82f6',
    priority: 'must',
  },
  // --- Tsunami ---
  {
    id: 'tsunami',
    label: '津波浸水想定',
    category: 'hazard',
    dataType: 'raster-tile',
    tileUrl: 'https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png',
    attribution: '<a href="https://disaportal.gsi.go.jp/" target="_blank">ハザードマップポータルサイト（国土交通省）</a>',
    defaultOpacity: 0.6,
    defaultVisible: false,
    color: '#06b6d4',
    priority: 'must',
  },
  // --- Earthquake (J-SHIS) ---
  {
    id: 'earthquake-prob',
    label: '地震動予測（震度6弱以上の確率）',
    category: 'hazard',
    dataType: 'raster-tile',
    tileUrl: 'https://maps.j-shis.bosai.go.jp/map/wms/tile/P_Vs30_TTLPGA000_T30_J_MAP/{z}/{x}/{y}.png',
    attribution: '<a href="https://www.j-shis.bosai.go.jp/" target="_blank">J-SHIS（防災科学技術研究所）</a>',
    defaultOpacity: 0.5,
    defaultVisible: false,
    color: '#f59e0b',
    priority: 'must',
  },
  // --- Landslide (GeoJSON from 国土数値情報) ---
  {
    id: 'landslide-warning',
    label: '土砂災害警戒区域',
    category: 'hazard',
    dataType: 'raster-tile',
    tileUrl: 'https://disaportaldata.gsi.go.jp/raster/05_dosekiryu_warning_area_data/{z}/{x}/{y}.png',
    attribution: '<a href="https://disaportal.gsi.go.jp/" target="_blank">ハザードマップポータルサイト（国土交通省）</a>',
    defaultOpacity: 0.6,
    defaultVisible: false,
    color: '#f59e0b',
    priority: 'must',
  },
  {
    id: 'landslide-special',
    label: '土砂災害特別警戒区域',
    category: 'hazard',
    dataType: 'raster-tile',
    tileUrl: 'https://disaportaldata.gsi.go.jp/raster/05_dosekiryu_kikenku_data/{z}/{x}/{y}.png',
    attribution: '<a href="https://disaportal.gsi.go.jp/" target="_blank">ハザードマップポータルサイト（国土交通省）</a>',
    defaultOpacity: 0.6,
    defaultVisible: false,
    color: '#ef4444',
    priority: 'must',
  },
  // ──────────────────────────────────────────────
  // Location layers
  // ──────────────────────────────────────────────
  {
    id: 'evacuation-shelter',
    label: '指定緊急避難場所・指定避難所',
    category: 'location',
    dataType: 'raster-tile',
    // Using GSI vector tile displayed as raster via style; fallback: show as icon overlay
    // For Phase 1 we use a simple approach: display markers via MapLibre symbol layer
    tileUrl: '',
    geojsonUrl: '/api/shelters',  // served from public data or future API
    attribution: '<a href="https://nlftp.mlit.go.jp/ksj/" target="_blank">国土数値情報（国土交通省）</a>',
    defaultOpacity: 1,
    defaultVisible: true,
    color: '#16a34a',
    priority: 'must',
  },
]

export const LAYER_MAP = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<string, LayerDef>

export function getLayersByCategory(category: LayerCategory): LayerDef[] {
  return LAYERS.filter((l) => l.category === category)
}

/** Returns only raster tile layers (safe to add as MapLibre raster sources) */
export function getRasterLayers(): LayerDef[] {
  return LAYERS.filter((l) => l.dataType === 'raster-tile' && l.tileUrl)
}
