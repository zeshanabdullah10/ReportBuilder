'use client'

import { useEffect, useState } from 'react'
import { useBuilderStore } from '@/lib/stores/builder-store'

/**
 * DropIndicator shows a visual preview of where a component will be placed
 * during drag operations from the toolbox.
 */
export function DropIndicator() {
  const { snapEnabled, gridSize } = useBuilderStore()
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const handleDragStart = () => {
      setIsDragging(true)
    }

    const handleDragEnd = () => {
      setIsDragging(false)
      setPosition(null)
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault() // Allow drop
      const canvas = document.querySelector('[data-craft-page="true"]')
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const style = window.getComputedStyle(canvas)
      const paddingLeft = parseInt(style.paddingLeft, 10) || 0
      const paddingTop = parseInt(style.paddingTop, 10) || 0

      let x = e.clientX - rect.left - paddingLeft
      let y = e.clientY - rect.top - paddingTop

      // Apply grid snapping if enabled
      if (snapEnabled) {
        x = Math.round(x / gridSize) * gridSize
        y = Math.round(y / gridSize) * gridSize
      }

      // Clamp to non-negative values
      x = Math.max(0, x)
      y = Math.max(0, y)

      setPosition({ x, y })
    }

    const handleDrop = () => {
      setIsDragging(false)
      setPosition(null)
    }

    // Listen for drag events on the document
    document.addEventListener('dragstart', handleDragStart, true)
    document.addEventListener('dragend', handleDragEnd, true)
    document.addEventListener('dragover', handleDragOver, true)
    document.addEventListener('drop', handleDrop, true)

    return () => {
      document.removeEventListener('dragstart', handleDragStart, true)
      document.removeEventListener('dragend', handleDragEnd, true)
      document.removeEventListener('dragover', handleDragOver, true)
      document.removeEventListener('drop', handleDrop, true)
    }
  }, [snapEnabled, gridSize])

  if (!position || !isDragging) return null

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: position.x,
        top: position.y,
        width: 200,
        height: 50,
        border: '2px dashed #00ffc8',
        borderRadius: 4,
        backgroundColor: 'rgba(0, 255, 200, 0.1)',
        boxShadow: '0 0 10px rgba(0, 255, 200, 0.3)',
      }}
    >
      <div
        className="absolute -top-6 left-0 text-xs text-[#00ffc8] font-mono whitespace-nowrap bg-[#0a0f14] px-1 rounded"
      >
        ({Math.round(position.x)}, {Math.round(position.y)})
      </div>
    </div>
  )
}
