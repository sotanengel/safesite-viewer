'use client'

import { create } from 'zustand'
import type { BasemapId } from '@/lib/basemaps'
import { DEFAULT_BASEMAP_ID } from '@/lib/basemaps'

interface MapState {
  basemap: BasemapId
  setBasemap: (basemap: BasemapId) => void
}

export const useMapStore = create<MapState>()((set) => ({
  basemap: DEFAULT_BASEMAP_ID,
  setBasemap: (basemap) => set({ basemap }),
}))
