'use client'

import { useEditor } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { useEffect, useRef } from 'react'

/**
 * Tracks drop position for new components using Craft.js.
 * When a new node is added from the toolbox, sets its initial x,y position
 * to where the mouse was when the drop occurred.
 */
export function DropPositionTracker() {
  const { actions, query } = useEditor()
  const { dropPosition, setDropPosition, snapEnabled, gridSize } = useBuilderStore()
  const processedNodes = useRef<Set<string>>(new Set())
  const canvasRectRef = useRef<DOMRect | null>(null)

  // Snap helper
  const snapToGrid = (value: number): number => {
    if (!snapEnabled) return value
    return Math.round(value / gridSize) * gridSize
  }

  // Track mouse position over the canvas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Find the Page/canvas element
      const canvas = document.querySelector('[data-craft-page="true"]')
      if (!canvas) return

      canvasRectRef.current = canvas.getBoundingClientRect()
      const rect = canvasRectRef.current

      // Calculate position relative to canvas
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Only set drop position if mouse is over the canvas
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        setDropPosition({ x: snapToGrid(x), y: snapToGrid(y) })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [setDropPosition, snapEnabled, gridSize])

  // Watch for new nodes using Craft.js query
  useEffect(() => {
    const state = query.getState()
    const nodeIds = Object.keys(state.nodes)

    // Find newly added nodes
    for (const nodeId of nodeIds) {
      if (nodeId === 'ROOT' || processedNodes.current.has(nodeId)) continue

      const node = state.nodes[nodeId]
      if (!node?.data?.props) {
        processedNodes.current.add(nodeId)
        continue
      }

      const { x, y } = node.data.props

      // If node has default position (0,0) and we have a drop position, update it
      if (x === 0 && y === 0 && dropPosition) {
        actions.setProp(nodeId, (props: any) => {
          props.x = dropPosition.x
          props.y = dropPosition.y
        })
      }

      processedNodes.current.add(nodeId)
    }
  }) // No deps - runs on every render but only processes new nodes

  return null
}
