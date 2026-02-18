'use client'

import { useEditor } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { useMemo } from 'react'

interface Guide {
  type: 'vertical' | 'horizontal'
  position: number
  variant: 'solid' | 'dashed'
}

const SNAP_THRESHOLD = 4

export function AlignmentGuides() {
  const { activeDrag, isPreviewMode } = useBuilderStore()
  const { query } = useEditor()

  const guides = useMemo(() => {
    if (!activeDrag || isPreviewMode) return []

    const guides: Guide[] = []
    const state = query.getState()

    // Get all node IDs except the one being dragged
    const allNodeIds = Object.keys(state.nodes).filter(
      (id) => id !== activeDrag.nodeId && id !== 'ROOT'
    )

    // Calculate bounds of dragged element
    const dragLeft = activeDrag.currentX
    const dragTop = activeDrag.currentY
    const dragRight = activeDrag.currentX + activeDrag.width
    const dragBottom = activeDrag.currentY + activeDrag.height
    const dragCenterX = activeDrag.currentX + activeDrag.width / 2
    const dragCenterY = activeDrag.currentY + activeDrag.height / 2

    // Collect all other component bounds
    const otherBounds: Array<{
      left: number
      top: number
      right: number
      bottom: number
      centerX: number
      centerY: number
    }> = []

    for (const nodeId of allNodeIds) {
      const node = state.nodes[nodeId]
      const props = node.data.props
      if (props && typeof props.x === 'number' && typeof props.width === 'number') {
        otherBounds.push({
          left: props.x,
          top: props.y || 0,
          right: props.x + (props.width || 100),
          bottom: (props.y || 0) + (props.height || 50),
          centerX: props.x + (props.width || 100) / 2,
          centerY: (props.y || 0) + (props.height || 50) / 2,
        })
      }
    }

    // Check for alignment matches
    for (const bounds of otherBounds) {
      // Left edge alignment
      if (Math.abs(dragLeft - bounds.left) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: bounds.left, variant: 'solid' })
      }
      // Right edge alignment
      if (Math.abs(dragRight - bounds.right) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: bounds.right, variant: 'solid' })
      }
      // Top edge alignment
      if (Math.abs(dragTop - bounds.top) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: bounds.top, variant: 'solid' })
      }
      // Bottom edge alignment
      if (Math.abs(dragBottom - bounds.bottom) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: bounds.bottom, variant: 'solid' })
      }
      // Center X alignment
      if (Math.abs(dragCenterX - bounds.centerX) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: bounds.centerX, variant: 'dashed' })
      }
      // Center Y alignment
      if (Math.abs(dragCenterY - bounds.centerY) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: bounds.centerY, variant: 'dashed' })
      }
    }

    // Remove duplicates
    const uniqueGuides = guides.filter(
      (guide, index, self) =>
        index ===
        self.findIndex(
          (g) => g.type === guide.type && g.position === guide.position && g.variant === guide.variant
        )
    )

    return uniqueGuides
  }, [activeDrag, isPreviewMode, query])

  if (!activeDrag || guides.length === 0 || isPreviewMode) return null

  return (
    <div className="absolute pointer-events-none z-30" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      {guides.map((guide, index) =>
        guide.type === 'vertical' ? (
          <div
            key={`v-${index}`}
            className="absolute top-0 bottom-0 w-px bg-[#00ffc8]"
            style={{
              left: guide.position,
              borderLeftStyle: guide.variant,
            }}
          />
        ) : (
          <div
            key={`h-${index}`}
            className="absolute left-0 right-0 h-px bg-[#00ffc8]"
            style={{
              top: guide.position,
              borderTopStyle: guide.variant,
            }}
          />
        )
      )}
    </div>
  )
}
