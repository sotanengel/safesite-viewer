'use client'

import { useState } from 'react'

type ShareMode = 'url' | 'png'

interface Props {
  /** Called when PNG export is requested. Returns a data URL or null. */
  onExportPng?: () => Promise<string | null>
}

export default function ShareButton({ onExportPng }: Props) {
  const [mode, setMode] = useState<ShareMode>('url')
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers / non-HTTPS
      const ta = document.createElement('textarea')
      ta.value = window.location.href
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExportPng = async () => {
    if (!onExportPng) return
    setExporting(true)
    try {
      const dataUrl = await onExportPng()
      if (!dataUrl) return
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `safesite-${Date.now()}.png`
      a.click()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-1 bg-white rounded-full shadow-md border border-gray-200 px-1 py-1">
      {/* Mode toggle */}
      <button
        onClick={() => setMode('url')}
        className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
          mode === 'url' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
        }`}
        title="URLをコピー"
      >
        🔗 共有
      </button>
      <button
        onClick={() => setMode('png')}
        className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
          mode === 'png' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
        }`}
        title="画像を保存"
      >
        📷 保存
      </button>

      {/* Action */}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />
      {mode === 'url' ? (
        <button
          onClick={handleCopyUrl}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {copied ? '✓ コピー済み' : 'コピー'}
        </button>
      ) : (
        <button
          onClick={handleExportPng}
          disabled={exporting || !onExportPng}
          className="rounded-full px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
        >
          {exporting ? '出力中...' : 'ダウンロード'}
        </button>
      )}
    </div>
  )
}
