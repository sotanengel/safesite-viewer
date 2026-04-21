'use client'

import { LAYERS, type LayerDef } from '@/lib/layers'
import { useMapStore } from '@/lib/store/map-store'

const CATEGORY_LABELS: Record<string, string> = {
  hazard: '災害リスク',
  terrain: '地形',
  location: '立地',
}

function LayerRow({ layer }: { layer: LayerDef }) {
  const state = useMapStore((s) => s.layerStates[layer.id])
  const setLayerVisible = useMapStore((s) => s.setLayerVisible)
  const setLayerOpacity = useMapStore((s) => s.setLayerOpacity)

  if (!state) return null

  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={state.visible}
          onChange={(e) => setLayerVisible(layer.id, e.target.checked)}
          className="w-3.5 h-3.5 rounded accent-blue-600"
        />
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: layer.color }}
        />
        <span className="text-xs text-gray-700 leading-tight flex-1">{layer.label}</span>
      </label>
      {state.visible && (
        <div className="mt-1.5 pl-6 flex items-center gap-2">
          <span className="text-[10px] text-gray-400 w-8">透過</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={state.opacity}
            onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
            className="flex-1 h-1 accent-blue-600"
            aria-label={`${layer.label} の透過度`}
          />
          <span className="text-[10px] text-gray-400 w-6 text-right">
            {Math.round(state.opacity * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}

export default function LayerPanel() {
  const categories = Array.from(new Set(LAYERS.map((l) => l.category)))

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide px-3 pt-3 pb-1">
        レイヤー
      </p>
      {categories.map((cat) => {
        const catLayers = LAYERS.filter((l) => l.category === cat && l.dataType === 'raster-tile' && l.tileUrl)
        if (catLayers.length === 0) return null
        return (
          <div key={cat} className="px-3 pb-2">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide py-1.5 sticky top-0 bg-white">
              {CATEGORY_LABELS[cat] ?? cat}
            </p>
            {catLayers.map((l) => (
              <LayerRow key={l.id} layer={l} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
