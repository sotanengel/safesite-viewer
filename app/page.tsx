'use client'

import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar/SearchBar'
import LayerPanel from '@/components/LayerPanel/LayerPanel'
import LegendBar from '@/components/Legend/LegendBar'
import SummaryPanel from '@/components/SummaryPanel/SummaryPanel'
import BottomSheet from '@/components/MobileSheet/BottomSheet'
import MobileLayerDrawer from '@/components/MobileSheet/MobileLayerDrawer'
import { useMapStore } from '@/lib/store/map-store'
import type { GeocodeResult } from '@/lib/api/geocode'

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false })

export default function Home() {
  const triggerFlyTo = useMapStore((s) => s.triggerFlyTo)
  const selectedLocation = useMapStore((s) => s.selectedLocation)

  const handleSearchSelect = (result: GeocodeResult) => {
    triggerFlyTo({ lat: result.lat, lng: result.lng, address: result.address })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center h-14 px-4 bg-white border-b border-gray-200 shadow-sm shrink-0 z-20 gap-4">
        <h1 className="text-sm font-bold text-gray-800 whitespace-nowrap hidden sm:block">
          SafeSite Viewer
        </h1>
        <div className="flex-1 flex justify-center">
          <SearchBar onSelect={handleSearchSelect} />
        </div>
      </header>

      {/* Main: sidebar + map + summary */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel: layer control (desktop only) */}
        <aside className="hidden md:flex w-56 flex-col bg-white border-r border-gray-200 overflow-hidden shrink-0">
          <LayerPanel />
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <MapView />
          {/* Mobile: hamburger drawer */}
          <div className="md:hidden">
            <MobileLayerDrawer />
          </div>
          <LegendBar />
        </main>

        {/* Right panel: summary (desktop lg+) */}
        <aside className="hidden lg:flex w-72 flex-col bg-white border-l border-gray-200 overflow-hidden shrink-0">
          <SummaryPanel />
        </aside>
      </div>

      {/* Mobile bottom sheet: shows summary when a location is selected */}
      <div className="lg:hidden">
        {selectedLocation ? (
          <BottomSheet defaultSnap="half">
            <SummaryPanel />
          </BottomSheet>
        ) : (
          <BottomSheet defaultSnap="collapsed">
            <div className="px-4 py-2 text-sm text-gray-400 italic">
              地図をタップして地点を選択してください
            </div>
          </BottomSheet>
        )}
      </div>
    </div>
  )
}
