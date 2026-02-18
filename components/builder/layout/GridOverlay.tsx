'use client'

import { useBuilderStore } from '@/lib/stores/builder-store'

export function GridOverlay() {
  const { gridSize, isPreviewMode } = useBuilderStore()

  // Don't show grid in preview mode
  if (isPreviewMode) return null

  const majorGridSize = gridSize * 10 // 80px for major lines

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0,255,200,0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,255,200,0.03) 1px, transparent 1px),
          linear-gradient(to right, rgba(0,255,200,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,255,200,0.08) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, ${majorGridSize}px ${majorGridSize}px, ${majorGridSize}px ${majorGridSize}px`,
      }}
    />
  )
}
