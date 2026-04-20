'use client'

import { useMapStore } from '@/lib/store/map-store'
import { BASEMAPS, type BasemapId } from '@/lib/basemaps'

export default function BasemapSwitcher() {
  const basemap = useMapStore((s) => s.basemap)
  const setBasemap = useMapStore((s) => s.setBasemap)

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden text-xs">
      {BASEMAPS.map((bm) => (
        <button
          key={bm.id}
          onClick={() => setBasemap(bm.id as BasemapId)}
          className={`block w-full px-3 py-2 text-left transition-colors ${
            basemap === bm.id
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {bm.label}
        </button>
      ))}
    </div>
  )
}
