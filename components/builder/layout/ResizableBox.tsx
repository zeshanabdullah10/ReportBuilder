'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useBuilderStore } from '@/lib/stores/builder-store'

interface ResizableBoxProps {
  x: number
  y: number
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  selected: boolean
  nodeId: string
  onPositionChange: (pos: { x?: number; y?: number; width?: number; height?: number }) => void
  children: React.ReactNode
  connectRef?: (ref: HTMLDivElement | null) => void
  zIndex?: number
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface ResizeState {
  isResizing: boolean
  handle: ResizeHandle | null
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  startLeft: number
  startTop: number
}

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  startLeft: number
  startTop: number
  hasMoved: boolean
}

export function ResizableBox({
  x,
  y,
  width,
  height,
  minWidth = 50,
  minHeight = 30,
  selected,
  nodeId,
  onPositionChange,
  children,
  connectRef,
  zIndex = 1,
}: ResizableBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const { snapEnabled, gridSize, setActiveDrag } = useBuilderStore()

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
  })

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    hasMoved: false,
  })

  const [currentPos, setCurrentPos] = useState({ x, y, width, height })

  // Sync with props when they change externally
  useEffect(() => {
    if (!resizeState.isResizing && !dragState.isDragging) {
      setCurrentPos({ x, y, width, height })
    }
  }, [x, y, width, height, resizeState.isResizing, dragState.isDragging])

  // Snap helper
  const snapToGrid = useCallback(
    (value: number): number => {
      if (!snapEnabled) return value
      return Math.round(value / gridSize) * gridSize
    },
    [snapEnabled, gridSize]
  )

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.preventDefault()
      e.stopPropagation()

      setResizeState({
        isResizing: true,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: currentPos.width as number,
        startHeight: currentPos.height as number,
        startLeft: currentPos.x,
        startTop: currentPos.y,
      })

      setActiveDrag({
        nodeId,
        startX: currentPos.x,
        startY: currentPos.y,
        currentX: currentPos.x,
        currentY: currentPos.y,
        width: currentPos.width as number,
        height: currentPos.height as number,
      })
    },
    [currentPos, nodeId, setActiveDrag]
  )

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return

      // Don't interfere with resize handles or interactive elements
      const target = e.target as HTMLElement
      if (
        target.closest('.resize-handle') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button')
      ) {
        return
      }

      // Store the starting position but don't prevent default yet
      // This allows Craft.js to handle selection if needed
      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: currentPos.x,
        startTop: currentPos.y,
        hasMoved: false,
      })

      // If already selected, start tracking for drag immediately
      if (selected) {
        setActiveDrag({
          nodeId,
          startX: currentPos.x,
          startY: currentPos.y,
          currentX: currentPos.x,
          currentY: currentPos.y,
          width: currentPos.width as number,
          height: currentPos.height as number,
        })
      }
    },
    [currentPos, nodeId, selected, setActiveDrag]
  )

  // Resize mouse move handler
  useEffect(() => {
    if (!resizeState.isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeState.startX
      const deltaY = e.clientY - resizeState.startY
      const handle = resizeState.handle!

      let newWidth = resizeState.startWidth
      let newHeight = resizeState.startHeight
      let newX = resizeState.startLeft
      let newY = resizeState.startTop

      switch (handle) {
        case 'nw':
          newWidth = Math.max(minWidth, resizeState.startWidth - deltaX)
          newHeight = Math.max(minHeight, resizeState.startHeight - deltaY)
          if (newWidth > minWidth) newX = resizeState.startLeft + deltaX
          if (newHeight > minHeight) newY = resizeState.startTop + deltaY
          break
        case 'n':
          newHeight = Math.max(minHeight, resizeState.startHeight - deltaY)
          if (newHeight > minHeight) newY = resizeState.startTop + deltaY
          break
        case 'ne':
          newWidth = Math.max(minWidth, resizeState.startWidth + deltaX)
          newHeight = Math.max(minHeight, resizeState.startHeight - deltaY)
          if (newHeight > minHeight) newY = resizeState.startTop + deltaY
          break
        case 'e':
          newWidth = Math.max(minWidth, resizeState.startWidth + deltaX)
          break
        case 'se':
          newWidth = Math.max(minWidth, resizeState.startWidth + deltaX)
          newHeight = Math.max(minHeight, resizeState.startHeight + deltaY)
          break
        case 's':
          newHeight = Math.max(minHeight, resizeState.startHeight + deltaY)
          break
        case 'sw':
          newWidth = Math.max(minWidth, resizeState.startWidth - deltaX)
          newHeight = Math.max(minHeight, resizeState.startHeight + deltaY)
          if (newWidth > minWidth) newX = resizeState.startLeft + deltaX
          break
        case 'w':
          newWidth = Math.max(minWidth, resizeState.startWidth - deltaX)
          if (newWidth > minWidth) newX = resizeState.startLeft + deltaX
          break
      }

      const snappedX = snapToGrid(newX)
      const snappedY = snapToGrid(newY)
      const snappedWidth = snapToGrid(newWidth)
      const snappedHeight = snapToGrid(newHeight)

      setCurrentPos({
        x: snappedX,
        y: snappedY,
        width: snappedWidth,
        height: snappedHeight,
      })

      setActiveDrag({
        nodeId,
        startX: snappedX,
        startY: snappedY,
        currentX: snappedX,
        currentY: snappedY,
        width: snappedWidth,
        height: snappedHeight,
      })
    }

    const handleMouseUp = () => {
      onPositionChange({
        x: currentPos.x,
        y: currentPos.y,
        width: currentPos.width as number,
        height: currentPos.height as number,
      })
      setResizeState((prev) => ({ ...prev, isResizing: false, handle: null }))
      setActiveDrag(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizeState, currentPos, minWidth, minHeight, onPositionChange, snapToGrid, nodeId, setActiveDrag])

  // Drag mouse move handler
  useEffect(() => {
    if (!dragState.isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX
      const deltaY = e.clientY - dragState.startY

      // Require minimum movement before actually dragging (to distinguish from click)
      const minMovement = 3
      const hasMovedEnough = Math.abs(deltaX) >= minMovement || Math.abs(deltaY) >= minMovement

      if (!hasMovedEnough && !dragState.hasMoved) {
        return
      }

      // First time moving - now we can prevent default behavior
      if (!dragState.hasMoved) {
        setDragState((prev) => ({ ...prev, hasMoved: true }))
      }

      const newX = snapToGrid(dragState.startLeft + deltaX)
      const newY = snapToGrid(dragState.startTop + deltaY)

      setCurrentPos((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }))

      setActiveDrag({
        nodeId,
        startX: newX,
        startY: newY,
        currentX: newX,
        currentY: newY,
        width: currentPos.width as number,
        height: currentPos.height as number,
      })
    }

    const handleMouseUp = () => {
      // Only save position if we actually moved
      if (dragState.hasMoved) {
        onPositionChange({
          x: currentPos.x,
          y: currentPos.y,
        })
      }
      setDragState((prev) => ({ ...prev, isDragging: false, hasMoved: false }))
      setActiveDrag(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, currentPos, onPositionChange, snapToGrid, nodeId, setActiveDrag])

  // Handle positions
  const handlePositions: Record<ResizeHandle, React.CSSProperties> = {
    nw: { top: -4, left: -4, cursor: 'nwse-resize' },
    n: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    ne: { top: -4, right: -4, cursor: 'nesw-resize' },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    se: { bottom: -4, right: -4, cursor: 'nwse-resize' },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    sw: { bottom: -4, left: -4, cursor: 'nesw-resize' },
    w: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
  }

  const isActive = resizeState.isResizing || dragState.isDragging

  return (
    <div
      ref={(ref) => {
        boxRef.current = ref
        if (connectRef) connectRef(ref)
      }}
      className="relative"
      style={{
        position: 'absolute',
        left: `${currentPos.x}px`,
        top: `${currentPos.y}px`,
        width: `${currentPos.width}px`,
        height: `${currentPos.height}px`,
        userSelect: isActive ? 'none' : 'auto',
        zIndex: selected ? Math.max(zIndex, 10) : zIndex,
      }}
    >
      {/* Drag handle overlay - only when selected, covers everything except resize handles */}
      {selected && (
        <div
          className="absolute inset-0 z-10 cursor-move"
          onMouseDown={handleDragStart}
          style={{ background: 'transparent' }}
        />
      )}

      {/* Content */}
      <div
        className="relative w-full h-full"
        style={{
          pointerEvents: selected ? 'none' : 'auto',
          cursor: selected ? 'move' : 'pointer'
        }}
      >
        {children}
      </div>

      {/* Resize handles - only visible when selected */}
      {selected && (
        <>
          {(Object.keys(handlePositions) as ResizeHandle[]).map((handle) => (
            <div
              key={handle}
              className="resize-handle absolute bg-[#00ffc8] border border-[#0a0f14] z-20"
              style={{
                ...handlePositions[handle],
                width: handle === 'n' || handle === 's' ? 24 : 8,
                height: handle === 'e' || handle === 'w' ? 24 : 8,
                borderRadius: 2,
              }}
              onMouseDown={(e) => handleResizeStart(e, handle)}
            />
          ))}
        </>
      )}
    </div>
  )
}
