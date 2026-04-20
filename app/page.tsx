'use client'

import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar/SearchBar'
import { useMapStore } from '@/lib/store/map-store'
import type { GeocodeResult } from '@/lib/api/geocode'

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false })

export default function Home() {
  const triggerFlyTo = useMapStore((s) => s.triggerFlyTo)

  const handleSearchSelect = (result: GeocodeResult) => {
    triggerFlyTo({ lat: result.lat, lng: result.lng, address: result.address })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center h-14 px-4 bg-white border-b border-gray-200 shadow-sm shrink-0 z-20 gap-4">
        <h1 className="text-sm font-bold text-gray-800 whitespace-nowrap">SafeSite Viewer</h1>
        <div className="flex-1 flex justify-center">
          <SearchBar onSelect={handleSearchSelect} />
        </div>
      </header>

      {/* Main: sidebar + map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel (layer control placeholder) */}
        <aside className="hidden md:flex w-56 flex-col bg-white border-r border-gray-200 p-3 overflow-y-auto shrink-0">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
            レイヤー
          </p>
          <p className="text-xs text-gray-300 italic">Coming soon (PR #4)</p>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <MapView />
        </main>

        {/* Right panel (summary placeholder) */}
        <aside className="hidden lg:flex w-72 flex-col bg-white border-l border-gray-200 p-3 overflow-y-auto shrink-0">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
            サマリ
          </p>
          <p className="text-xs text-gray-300 italic">
            地図をクリックして地点を選択してください (PR #5)
          </p>
        </aside>
      </div>
    </div>
  )
}
