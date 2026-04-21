'use client'

import { useState } from 'react'
import { LAYERS } from '@/lib/layers'
import { useMapStore } from '@/lib/store/map-store'

export default function LegendBar() {
  const [open, setOpen] = useState(false)
  const layerStates = useMapStore((s) => s.layerStates)

  const visibleLayers = LAYERS.filter(
    (l) => l.dataType === 'raster-tile' && l.tileUrl && layerStates[l.id]?.visible,
  )

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] text-gray-600 shadow border border-gray-200 hover:bg-white transition-colors"
      >
        凡例 {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 p-3 min-w-[200px]">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">
            表示中のレイヤー
          </p>
          {visibleLayers.length === 0 ? (
            <p className="text-xs text-gray-400 italic">なし</p>
          ) : (
            <ul className="space-y-1.5">
              {visibleLayers.map((l) => (
                <li key={l.id} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: l.color, opacity: 0.8 }}
                  />
                  <span className="text-xs text-gray-700">{l.label}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 pt-2 border-t border-gray-100 text-[9px] text-gray-400 space-y-0.5">
            <p>出典: 国土地理院・国土交通省・防災科研</p>
          </div>
        </div>
      )}
    </div>
  )
}
