'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react'

interface CanvasViewportProps {
  children: React.ReactNode
}

export function CanvasViewport({ children }: CanvasViewportProps) {
  const {
    zoom,
    panX,
    panY,
    isPanning,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setPan,
    setIsPanning,
    isPreviewMode,
  } = useBuilderStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const lastPanPosition = useRef({ x: 0, y: 0 })

  // Handle keyboard shortcuts for zoom
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Zoom shortcuts: Ctrl/Cmd + +/-/0
    if ((e.ctrlKey || e.metaKey) && !isPreviewMode) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        zoomIn()
      } else if (e.key === '-') {
        e.preventDefault()
        zoomOut()
      } else if (e.key === '0') {
        e.preventDefault()
        resetZoom()
      }
    }

    // Space bar for panning mode
    if (e.code === 'Space' && !e.repeat && !isPreviewMode) {
      // Only activate if not focused on an input
      const target = e.target as HTMLElement
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
        e.preventDefault()
        setIsSpacePressed(true)
      }
    }
  }, [zoomIn, zoomOut, resetZoom, isPreviewMode])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setIsSpacePressed(false)
      setIsPanning(false)
    }
  }, [setIsPanning])

  // Handle mouse wheel for zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isPreviewMode) return

    // Ctrl/Cmd + wheel for zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newZoom = Math.max(0.25, Math.min(4, zoom + delta))
      setZoom(newZoom)
    }
  }, [zoom, setZoom, isPreviewMode])

  // Handle panning with mouse drag (when space is held or middle mouse button)
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (isPreviewMode) return

    // Middle mouse button or space + left click
    if (e.button === 1 || (isSpacePressed && e.button === 0)) {
      e.preventDefault()
      setIsPanning(true)
      lastPanPosition.current = { x: e.clientX, y: e.clientY }
    }
  }, [isSpacePressed, setIsPanning, isPreviewMode])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning) return

    const deltaX = e.clientX - lastPanPosition.current.x
    const deltaY = e.clientY - lastPanPosition.current.y

    setPan(panX + deltaX, panY + deltaY)
    lastPanPosition.current = { x: e.clientX, y: e.clientY }
  }, [isPanning, panX, panY, setPan])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [setIsPanning])

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp])

  const cursorClass = isSpacePressed
    ? 'cursor-grab'
    : isPanning
    ? 'cursor-grabbing'
    : ''

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${cursorClass}`}
      style={{ cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : undefined }}
    >
      {/* Zoomable/Pannable content */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>

      {/* Zoom controls - fixed position */}
      {!isPreviewMode && (
        <div className="absolute bottom-4 right-4 z-50 flex items-center gap-1 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-1 shadow-lg">
          <button
            onClick={zoomOut}
            className="p-2 text-gray-400 hover:text-[#00ffc8] hover:bg-[rgba(0,255,200,0.1)] rounded transition-colors"
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="px-2 py-1 text-xs text-gray-300 font-mono min-w-[50px] text-center select-none">
            {Math.round(zoom * 100)}%
          </div>

          <button
            onClick={zoomIn}
            className="p-2 text-gray-400 hover:text-[#00ffc8] hover:bg-[rgba(0,255,200,0.1)] rounded transition-colors"
            title="Zoom In (Ctrl++)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-[rgba(0,255,200,0.2)]" />

          <button
            onClick={resetZoom}
            className="p-2 text-gray-400 hover:text-[#00ffc8] hover:bg-[rgba(0,255,200,0.1)] rounded transition-colors"
            title="Reset Zoom (Ctrl+0)"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pan indicator */}
      {isPanning && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#050810] border border-[rgba(0,255,200,0.3)] text-[#00ffc8] text-sm">
            <Move className="w-4 h-4" />
            Panning
          </div>
        </div>
      )}
    </div>
  )
}
