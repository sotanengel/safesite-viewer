export type BasemapId = 'standard' | 'pale' | 'photo'

export interface Basemap {
  id: BasemapId
  label: string
  tileUrl: string
  tileSize: 256 | 512
  maxzoom: number
  attribution: string
}

export const BASEMAPS: Basemap[] = [
  {
    id: 'standard',
    label: '標準地図',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 18,
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル（国土地理院）</a>',
  },
  {
    id: 'pale',
    label: '淡色地図',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 18,
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル（国土地理院）</a>',
  },
  {
    id: 'photo',
    label: '航空写真',
    tileUrl: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
    tileSize: 256,
    maxzoom: 18,
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル（国土地理院）</a>',
  },
]

export const DEFAULT_BASEMAP_ID: BasemapId = 'standard'

export function getBasemap(id: BasemapId): Basemap {
  return BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0]
}
