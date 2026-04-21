'use client'

import { create } from 'zustand'
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
}

export const useMapStore = create<MapState>()((set) => ({
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
}))
