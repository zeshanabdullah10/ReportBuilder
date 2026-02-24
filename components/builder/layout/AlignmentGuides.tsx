'use client'

import { useEditor } from '@craftjs/core'
import { useBuilderStore, PAGE_SIZE_PRESETS } from '@/lib/stores/builder-store'
import { useMemo } from 'react'

interface Guide {
  type: 'vertical' | 'horizontal'
  position: number
  variant: 'solid' | 'dashed'
  color?: string
}

const SNAP_THRESHOLD = 4

export function AlignmentGuides() {
  const { activeDrag, isPreviewMode } = useBuilderStore()
  const { query } = useEditor()

  const guides = useMemo(() => {
    if (!activeDrag || isPreviewMode) return []

    const guides: Guide[] = []
    const state = query.getState()

    // Get page dimensions from ROOT node
    const rootNode = state.nodes['ROOT']
    const pageProps = rootNode?.data?.props || {}
    const pageSize = pageProps.pageSize || 'A4'
    const padding = pageProps.padding || 40
    const customWidth = pageProps.customWidth || 794
    const customHeight = pageProps.customHeight || 1123

    // Calculate content area dimensions
    const preset = PAGE_SIZE_PRESETS[pageSize as keyof typeof PAGE_SIZE_PRESETS]
    const pageWidth = pageSize === 'Custom' ? customWidth : preset.width
    const pageHeight = pageSize === 'Custom' ? customHeight : preset.height
    const contentWidth = pageWidth - (padding * 2)
    const contentHeight = pageHeight - (padding * 2)

    // Page reference points
    const pageGuides = {
      left: 0,
      right: contentWidth,
      top: 0,
      bottom: contentHeight,
      centerX: contentWidth / 2,
      centerY: contentHeight / 2,
      thirdX1: contentWidth / 3,
      thirdX2: (contentWidth * 2) / 3,
      thirdY1: contentHeight / 3,
      thirdY2: (contentHeight * 2) / 3,
    }

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
    const dragWidth = activeDrag.width
    const dragHeight = activeDrag.height

    // === PAGE ALIGNMENT GUIDES ===

    // Page center (dashed, highlighted)
    if (Math.abs(dragCenterX - pageGuides.centerX) < SNAP_THRESHOLD) {
      guides.push({ type: 'vertical', position: pageGuides.centerX, variant: 'dashed', color: '#00ffc8' })
    }
    if (Math.abs(dragCenterY - pageGuides.centerY) < SNAP_THRESHOLD) {
      guides.push({ type: 'horizontal', position: pageGuides.centerY, variant: 'dashed', color: '#00ffc8' })
    }

    // Page left edge
    if (Math.abs(dragLeft - pageGuides.left) < SNAP_THRESHOLD) {
      guides.push({ type: 'vertical', position: pageGuides.left, variant: 'solid', color: '#00ffc8' })
    }
    // Page right edge
    if (Math.abs(dragRight - pageGuides.right) < SNAP_THRESHOLD) {
      guides.push({ type: 'vertical', position: pageGuides.right, variant: 'solid', color: '#00ffc8' })
    }
    // Page top edge
    if (Math.abs(dragTop - pageGuides.top) < SNAP_THRESHOLD) {
      guides.push({ type: 'horizontal', position: pageGuides.top, variant: 'solid', color: '#00ffc8' })
    }
    // Page bottom edge
    if (Math.abs(dragBottom - pageGuides.bottom) < SNAP_THRESHOLD) {
      guides.push({ type: 'horizontal', position: pageGuides.bottom, variant: 'solid', color: '#00ffc8' })
    }

    // Equal spacing from page edges (left = right, top = bottom)
    const leftSpace = dragLeft
    const rightSpace = contentWidth - dragRight
    if (Math.abs(leftSpace - rightSpace) < SNAP_THRESHOLD && leftSpace > 0) {
      guides.push({ type: 'vertical', position: pageGuides.left, variant: 'dashed', color: '#39ff14' })
      guides.push({ type: 'vertical', position: pageGuides.right, variant: 'dashed', color: '#39ff14' })
    }
    const topSpace = dragTop
    const bottomSpace = contentHeight - dragBottom
    if (Math.abs(topSpace - bottomSpace) < SNAP_THRESHOLD && topSpace > 0) {
      guides.push({ type: 'horizontal', position: pageGuides.top, variant: 'dashed', color: '#39ff14' })
      guides.push({ type: 'horizontal', position: pageGuides.bottom, variant: 'dashed', color: '#39ff14' })
    }

    // Rule of thirds
    if (Math.abs(dragLeft - pageGuides.thirdX1) < SNAP_THRESHOLD ||
        Math.abs(dragRight - pageGuides.thirdX1) < SNAP_THRESHOLD ||
        Math.abs(dragCenterX - pageGuides.thirdX1) < SNAP_THRESHOLD) {
      guides.push({ type: 'vertical', position: pageGuides.thirdX1, variant: 'dashed', color: 'rgba(0,255,200,0.5)' })
    }
    if (Math.abs(dragLeft - pageGuides.thirdX2) < SNAP_THRESHOLD ||
        Math.abs(dragRight - pageGuides.thirdX2) < SNAP_THRESHOLD ||
        Math.abs(dragCenterX - pageGuides.thirdX2) < SNAP_THRESHOLD) {
      guides.push({ type: 'vertical', position: pageGuides.thirdX2, variant: 'dashed', color: 'rgba(0,255,200,0.5)' })
    }
    if (Math.abs(dragTop - pageGuides.thirdY1) < SNAP_THRESHOLD ||
        Math.abs(dragBottom - pageGuides.thirdY1) < SNAP_THRESHOLD ||
        Math.abs(dragCenterY - pageGuides.thirdY1) < SNAP_THRESHOLD) {
      guides.push({ type: 'horizontal', position: pageGuides.thirdY1, variant: 'dashed', color: 'rgba(0,255,200,0.5)' })
    }
    if (Math.abs(dragTop - pageGuides.thirdY2) < SNAP_THRESHOLD ||
        Math.abs(dragBottom - pageGuides.thirdY2) < SNAP_THRESHOLD ||
        Math.abs(dragCenterY - pageGuides.thirdY2) < SNAP_THRESHOLD) {
      guides.push({ type: 'horizontal', position: pageGuides.thirdY2, variant: 'dashed', color: 'rgba(0,255,200,0.5)' })
    }

    // === COMPONENT TO COMPONENT ALIGNMENT ===

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

    // Check for alignment matches with other components
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
          (g) => g.type === guide.type && g.position === guide.position
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
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: guide.position,
              backgroundColor: guide.color || '#00ffc8',
              borderLeftStyle: guide.variant,
            }}
          />
        ) : (
          <div
            key={`h-${index}`}
            className="absolute left-0 right-0 h-px"
            style={{
              top: guide.position,
              backgroundColor: guide.color || '#00ffc8',
              borderTopStyle: guide.variant,
            }}
          />
        )
      )}
    </div>
  )
}
