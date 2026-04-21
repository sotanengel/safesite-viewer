'use client'

import { create } from 'zustand'
import type maplibregl from 'maplibre-gl'
import type { BasemapId } from '@/lib/basemaps'
import { DEFAULT_BASEMAP_ID } from '@/lib/basemaps'
import { getRasterLayers } from '@/lib/layers'

export interface SelectedLocation {
  lat: number
  lng: number
  address?: string
}

export interface LayerState {
  visible: boolean
  opacity: number
}

function buildDefaultLayerStates(): Record<string, LayerState> {
  return Object.fromEntries(
    getRasterLayers().map((l) => [l.id, { visible: l.defaultVisible, opacity: l.defaultOpacity }]),
  )
}

interface MapState {
  basemap: BasemapId
  setBasemap: (basemap: BasemapId) => void
  selectedLocation: SelectedLocation | null
  setSelectedLocation: (location: SelectedLocation | null) => void
  flyToTrigger: number
  flyToLocation: SelectedLocation | null
  triggerFlyTo: (location: SelectedLocation) => void
  layerStates: Record<string, LayerState>
  setLayerVisible: (layerId: string, visible: boolean) => void
  setLayerOpacity: (layerId: string, opacity: number) => void
  /** Reference to the MapLibre map instance, set by MapView on mount */
  mapInstance: maplibregl.Map | null
  setMapInstance: (map: maplibregl.Map | null) => void
  /** Export current map view as PNG data URL */
  exportMapPng: () => Promise<string | null>
}

export const useMapStore = create<MapState>()((set, get) => ({
  basemap: DEFAULT_BASEMAP_ID,
  setBasemap: (basemap) => set({ basemap }),
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  flyToTrigger: 0,
  flyToLocation: null,
  triggerFlyTo: (location) =>
    set((s) => ({ flyToTrigger: s.flyToTrigger + 1, flyToLocation: location })),
  layerStates: buildDefaultLayerStates(),
  setLayerVisible: (layerId, visible) =>
    set((s) => ({
      layerStates: {
        ...s.layerStates,
        [layerId]: { ...s.layerStates[layerId], visible },
      },
    })),
  setLayerOpacity: (layerId, opacity) =>
    set((s) => ({
      layerStates: {
        ...s.layerStates,
        [layerId]: { ...s.layerStates[layerId], opacity },
      },
    })),
  mapInstance: null,
  setMapInstance: (map) => set({ mapInstance: map }),
  exportMapPng: () => {
    const map = get().mapInstance
    if (!map) return Promise.resolve(null)
    return new Promise((resolve) => {
      map.once('render', () => {
        const canvas = map.getCanvas()
        resolve(canvas.toDataURL('image/png'))
      })
      map.triggerRepaint()
    })
  },
}))
