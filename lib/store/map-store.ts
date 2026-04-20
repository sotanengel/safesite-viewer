'use client'

import { create } from 'zustand'
import type { BasemapId } from '@/lib/basemaps'
import { DEFAULT_BASEMAP_ID } from '@/lib/basemaps'

export interface SelectedLocation {
  lat: number
  lng: number
  address?: string
}

interface MapState {
  basemap: BasemapId
  setBasemap: (basemap: BasemapId) => void
  selectedLocation: SelectedLocation | null
  setSelectedLocation: (location: SelectedLocation | null) => void
  /** Signal to fly the map to a location (increments on each call) */
  flyToTrigger: number
  flyToLocation: SelectedLocation | null
  triggerFlyTo: (location: SelectedLocation) => void
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
}))
