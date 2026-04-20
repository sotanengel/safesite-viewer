'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { GeocodeResult } from '@/lib/api/geocode'
import { loadHistory, saveToHistory } from '@/lib/search-history'

interface Props {
  onSelect: (result: GeocodeResult) => void
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([])
  const [history, setHistory] = useState<GeocodeResult[]>(() => loadHistory())
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data: GeocodeResult[] = await res.json()
        setSuggestions(data)
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setActiveIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
    setIsOpen(true)
  }

  const handleSelect = useCallback(
    (result: GeocodeResult) => {
      setQuery(result.address)
      setSuggestions([])
      setIsOpen(false)
      saveToHistory(result)
      setHistory(loadHistory())
      onSelect(result)
    },
    [onSelect],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query ? suggestions : history
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(items[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const displayItems = query ? suggestions : history
  const showDropdown = isOpen && (displayItems.length > 0 || loading)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="flex items-center bg-white rounded-full shadow-md border border-gray-200 px-4 py-2 gap-2">
        {/* Search icon */}
        <svg
          className="w-4 h-4 text-gray-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="住所・施設名で検索..."
          className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
          role="combobox"
          aria-label="住所検索"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="search-listbox"
        />
        {loading && (
          <svg
            className="w-4 h-4 text-blue-500 animate-spin shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery('')
              setSuggestions([])
              inputRef.current?.focus()
            }}
            className="w-4 h-4 text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="クリア"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id="search-listbox"
          className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden"
          role="listbox"
        >
          {!query && history.length > 0 && (
            <li className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-wide font-medium bg-gray-50">
              検索履歴
            </li>
          )}
          {displayItems.map((item, i) => (
            <li
              key={`${item.lat}-${item.lng}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(item)}
              className={`px-4 py-2.5 cursor-pointer text-sm flex items-start gap-2 ${
                i === activeIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg
                className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <circle cx="12" cy="11" r="3" strokeWidth={2} />
              </svg>
              <span className="truncate">{item.address}</span>
            </li>
          ))}
          {loading && (
            <li className="px-4 py-2.5 text-sm text-gray-400 italic">検索中...</li>
          )}
        </ul>
      )}
    </div>
  )
}
