'use client'

import { useRef, useEffect, useState, type ReactNode } from 'react'

type SnapPoint = 'collapsed' | 'half' | 'full'

const SNAP_HEIGHTS: Record<SnapPoint, number> = {
  collapsed: 52,   // drag handle only
  half: 0.45,      // 45% of viewport (calculated at runtime)
  full: 0.88,      // 88% of viewport
}

interface Props {
  children: ReactNode
  defaultSnap?: SnapPoint
}

export default function BottomSheet({ children, defaultSnap = 'half' }: Props) {
  const [snap, setSnap] = useState<SnapPoint>(defaultSnap)
  const [dragging, setDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartSnap = useRef<SnapPoint>(defaultSnap)
  const sheetRef = useRef<HTMLDivElement>(null)

  const getHeight = (s: SnapPoint) => {
    if (s === 'collapsed') return SNAP_HEIGHTS.collapsed
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    return Math.round(vh * (s === 'half' ? SNAP_HEIGHTS.half : SNAP_HEIGHTS.full))
  }

  const [height, setHeight] = useState(() => getHeight(defaultSnap))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeight(getHeight(snap))
  }, [snap])

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY
    dragStartSnap.current = snap
    setDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const dy = dragStartY.current - e.clientY  // positive = dragging up
    const baseH = getHeight(dragStartSnap.current)
    const newH = Math.max(SNAP_HEIGHTS.collapsed, baseH + dy)
    if (sheetRef.current) sheetRef.current.style.height = `${newH}px`
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return
    setDragging(false)
    const dy = dragStartY.current - e.clientY
    const vh = window.innerHeight

    // Snap decision based on drag direction and distance
    if (dy > 80) {
      setSnap(dragStartSnap.current === 'collapsed' ? 'half' : 'full')
    } else if (dy < -80) {
      setSnap(dragStartSnap.current === 'full' ? 'half' : 'collapsed')
    } else {
      // Snap back to start
      setHeight(getHeight(dragStartSnap.current))
    }
    if (sheetRef.current) sheetRef.current.style.height = ''  // reset inline, let state take over
    void vh
  }

  return (
    <div
      ref={sheetRef}
      className={`fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden ${
        dragging ? '' : 'transition-[height] duration-300 ease-out'
      }`}
      style={{ height }}
    >
      {/* Drag handle */}
      <div
        className="flex-none flex justify-center items-center h-12 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label="シートを展開/縮小"
      >
        <div className="w-10 h-1.5 rounded-full bg-gray-300" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  )
}
