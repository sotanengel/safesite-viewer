'use client'

import { useEffect, useState } from 'react'
import { useMapStore } from '@/lib/store/map-store'
import type { SummaryResponse, Severity } from '@/lib/api/summary'

const SEVERITY_CONFIG: Record<Severity, { bg: string; text: string; icon: string }> = {
  safe: { bg: 'bg-green-50', text: 'text-green-700', icon: '○' },
  caution: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '△' },
  warning: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '▲' },
  danger: { bg: 'bg-red-50', text: 'text-red-700', icon: '×' },
  unknown: { bg: 'bg-gray-50', text: 'text-gray-500', icon: '–' },
}

interface HazardCardProps {
  title: string
  severity: Severity
  label: string
}

function HazardCard({ title, severity, label }: HazardCardProps) {
  const cfg = SEVERITY_CONFIG[severity]
  return (
    <div className={`rounded-lg p-3 ${cfg.bg} mb-2`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{title}</span>
        <span className={`text-sm font-bold ${cfg.text}`}>{cfg.icon}</span>
      </div>
      <p className={`text-xs leading-snug ${cfg.text}`}>{label}</p>
    </div>
  )
}

export default function SummaryPanel() {
  const selectedLocation = useMapStore((s) => s.selectedLocation)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedLocation) return

    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)

    fetch(`/api/summary?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`)
      .then((r) => r.json())
      .then((data: SummaryResponse) => {
        if (!cancelled) {
          setSummary(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(null)
          setError('データの取得に失敗しました')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedLocation])

  if (!selectedLocation) {
    return (
      <div className="p-3 flex flex-col gap-2">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
          サマリ
        </p>
        <p className="text-xs text-gray-400 italic leading-relaxed">
          地図をクリックして地点を選択してください
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 flex flex-col gap-2 overflow-y-auto">
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">サマリ</p>

      {/* Location info */}
      <div className="rounded-lg bg-blue-50 p-3">
        {selectedLocation.address && (
          <p className="text-xs font-medium text-blue-800 mb-1 leading-snug">
            {selectedLocation.address}
          </p>
        )}
        <p className="text-[10px] text-blue-600 font-mono">
          {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
        </p>
      </div>

      {loading && (
        <p className="text-xs text-gray-400 italic text-center py-2">読み込み中...</p>
      )}

      {error && (
        <p className="text-xs text-red-500 italic">{error}</p>
      )}

      {summary && !loading && (
        <>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-1">
            リスク評価
          </p>
          <div className="text-[10px] text-amber-700 bg-amber-50 rounded-md px-2 py-1.5 leading-snug">
            本データは参考情報です。不動産取引の重要事項説明の代替ではありません。
          </div>

          <HazardCard
            title="地震（30年以内震度6弱以上）"
            severity={summary.hazards.earthquake.severity}
            label={summary.hazards.earthquake.label}
          />
          <HazardCard
            title="洪水"
            severity={summary.hazards.flood.severity}
            label={summary.hazards.flood.label}
          />
          <HazardCard
            title="津波"
            severity={summary.hazards.tsunami.severity}
            label={summary.hazards.tsunami.label}
          />
          <HazardCard
            title="土砂災害"
            severity={summary.hazards.landslide.severity}
            label={summary.hazards.landslide.label}
          />

          {/* Sources */}
          <div className="mt-1 pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-medium mb-1">データ出典</p>
            <ul className="space-y-0.5">
              {summary.sources.map((s) => (
                <li key={s} className="text-[10px] text-gray-400">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Portal link */}
          <a
            href={`https://disaportal.gsi.go.jp/maps/?lat=${summary.lat}&lng=${summary.lng}&zoom=15`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-center text-xs text-blue-600 hover:text-blue-800 underline"
          >
            ハザードマップポータルで詳細確認 ↗
          </a>
        </>
      )}
    </div>
  )
}
