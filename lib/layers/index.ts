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
// Hazard layers
// ──────────────────────────────────────────────

export const LAYERS: LayerDef[] = [
  // --- Flood (Must) ---
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
  // --- Tsunami (Must) ---
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
  // --- Earthquake / J-SHIS (Must) ---
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
  // --- Landslide warning (Must) ---
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
  // --- Landslide special (Must) ---
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
  // --- High tide (Should) ---
  {
    id: 'high-tide',
    label: '高潮浸水想定',
    category: 'hazard',
    dataType: 'raster-tile',
    tileUrl: 'https://disaportaldata.gsi.go.jp/raster/03_hightide_l2_shinsuishin_data/{z}/{x}/{y}.png',
    attribution: '<a href="https://disaportal.gsi.go.jp/" target="_blank">ハザードマップポータルサイト（国土交通省）</a>',
    defaultOpacity: 0.6,
    defaultVisible: false,
    color: '#8b5cf6',
    priority: 'should',
  },
  // --- Surface geology amplification / J-SHIS (Should) ---
  {
    id: 'surface-geology',
    label: '表層地盤増幅率',
    category: 'hazard',
    dataType: 'raster-tile',
    tileUrl: 'https://maps.j-shis.bosai.go.jp/map/wms/tile/S_AVS30_J_MAP/{z}/{x}/{y}.png',
    attribution: '<a href="https://www.j-shis.bosai.go.jp/" target="_blank">J-SHIS（防災科学技術研究所）</a>',
    defaultOpacity: 0.5,
    defaultVisible: false,
    color: '#d97706',
    priority: 'should',
  },

  // ──────────────────────────────────────────────
  // Terrain layers (地理院タイル)
  // ──────────────────────────────────────────────
  {
    id: 'terrain-relief',
    label: '標高（段彩図）',
    category: 'terrain',
    dataType: 'raster-tile',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png',
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル（国土地理院）</a>',
    defaultOpacity: 0.5,
    defaultVisible: false,
    color: '#84cc16',
    priority: 'must',
  },
  {
    id: 'terrain-slope',
    label: '傾斜量図',
    category: 'terrain',
    dataType: 'raster-tile',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/slopemap/{z}/{x}/{y}.png',
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル（国土地理院）</a>',
    defaultOpacity: 0.5,
    defaultVisible: false,
    color: '#a3a3a3',
    priority: 'should',
  },
  {
    id: 'terrain-floodplain',
    label: '治水地形分類図',
    category: 'terrain',
    dataType: 'raster-tile',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/chisui/{z}/{x}/{y}.png',
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル（国土地理院）</a>',
    defaultOpacity: 0.6,
    defaultVisible: false,
    color: '#0ea5e9',
    priority: 'should',
  },
  {
    id: 'terrain-land-condition',
    label: '土地条件図',
    category: 'terrain',
    dataType: 'raster-tile',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/lcm25k/{z}/{x}/{y}.png',
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル（国土地理院）</a>',
    defaultOpacity: 0.6,
    defaultVisible: false,
    color: '#f97316',
    priority: 'should',
  },

  // ──────────────────────────────────────────────
  // Location layers (立地)
  // ──────────────────────────────────────────────
  {
    id: 'evacuation-shelter',
    label: '指定緊急避難場所・指定避難所',
    category: 'location',
    dataType: 'raster-tile',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/experimental_evac/{z}/{x}/{y}.png',
    attribution: '<a href="https://maps.gsi.go.jp/" target="_blank">国土地理院</a>',
    defaultOpacity: 0.8,
    defaultVisible: true,
    color: '#16a34a',
    priority: 'must',
  },
  {
    id: 'station',
    label: '鉄道駅',
    category: 'location',
    dataType: 'raster-tile',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
    // We overlay station symbols via standard map; dedicated tile TBD
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル（国土地理院）</a>',
    defaultOpacity: 0,
    defaultVisible: false,
    color: '#f43f5e',
    priority: 'must',
  },
]

export const LAYER_MAP = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<string, LayerDef>

export function getLayersByCategory(category: LayerCategory): LayerDef[] {
  return LAYERS.filter((l) => l.category === category)
}

/** Returns only raster tile layers with a valid URL */
export function getRasterLayers(): LayerDef[] {
  return LAYERS.filter((l) => l.dataType === 'raster-tile' && l.tileUrl)
}
