'use client'

import { useEditor } from '@craftjs/core'
import { useEffect, useRef, useCallback } from 'react'
import { useBuilderStore } from '@/lib/stores/builder-store'

/**
 * DropPositionTracker tracks mouse position over the canvas and sets
 * the initial x,y position of newly dropped components to match the
 * cursor location instead of defaulting to (0,0).
 */
export function DropPositionTracker() {
  const { actions, query } = useEditor()
  const { snapEnabled, gridSize } = useBuilderStore()
  const processedNodes = useRef<Set<string>>(new Set())
  const lastMousePos = useRef({ x: 0, y: 0 })
  const isProcessing = useRef(false)

  // Track mouse position over canvas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = document.querySelector('[data-craft-page="true"]')
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const style = window.getComputedStyle(canvas)
      const paddingLeft = parseInt(style.paddingLeft, 10) || 0
      const paddingTop = parseInt(style.paddingTop, 10) || 0

      // Calculate position relative to the content area (accounting for padding)
      lastMousePos.current = {
        x: e.clientX - rect.left - paddingLeft,
        y: e.clientY - rect.top - paddingTop,
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Process new nodes - called via query.getState() polling with debounce
  const processNewNodes = useCallback(() => {
    if (isProcessing.current) return
    isProcessing.current = true

    try {
      const state = query.getState()
      const nodes = state.nodes

      for (const nodeId of Object.keys(nodes)) {
        if (nodeId === 'ROOT' || processedNodes.current.has(nodeId)) continue

        const node = nodes[nodeId]
        if (!node?.data?.props) {
          processedNodes.current.add(nodeId)
          continue
        }

        const props = node.data.props as { x?: number; y?: number }

        // If node has default position (0,0), it's likely newly dropped
        if (props.x === 0 && props.y === 0) {
          let targetX = lastMousePos.current.x
          let targetY = lastMousePos.current.y

          // Apply grid snapping if enabled
          if (snapEnabled) {
            targetX = Math.round(targetX / gridSize) * gridSize
            targetY = Math.round(targetY / gridSize) * gridSize
          }

          // Clamp to non-negative values
          targetX = Math.max(0, targetX)
          targetY = Math.max(0, targetY)

          actions.setProp(nodeId, (nodeProps: { x?: number; y?: number }) => {
            nodeProps.x = targetX
            nodeProps.y = targetY
          })
        }

        processedNodes.current.add(nodeId)
      }
    } finally {
      isProcessing.current = false
    }
  }, [actions, query, snapEnabled, gridSize])

  // Use a short interval to check for new nodes (more reliable than useEffect on every render)
  useEffect(() => {
    const interval = setInterval(processNewNodes, 50)
    return () => clearInterval(interval)
  }, [processNewNodes])

  return null
}
