'use client'

import { useEffect } from 'react'
import { useEditor } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'

/**
 * Hook for handling keyboard shortcuts in the template builder
 *
 * Shortcuts:
 * - Delete/Backspace: Delete selected component
 * - Escape: Deselect component
 * - Arrow keys: Nudge component (8px, or 1px with Shift)
 * - Ctrl+S: Save template
 * - Ctrl+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z: Redo
 */
export function useKeyboardShortcuts() {
  const { actions, query } = useEditor((state, query) => ({
    selectedNodeId: state.events.selected.values().next().value,
  }))

  const {
    selectedNodeId,
    snapEnabled,
    gridSize,
    setHasUnsavedChanges,
    isPreviewMode,
  } = useBuilderStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Ignore if in preview mode (except for Escape)
      if (isPreviewMode && e.key !== 'Escape') {
        return
      }

      const nudgeAmount = e.shiftKey ? 1 : snapEnabled ? gridSize : 1

      // Handle keyboard shortcuts
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          // Delete selected component
          if (selectedNodeId && selectedNodeId !== 'ROOT') {
            e.preventDefault()
            actions.delete(selectedNodeId)
            setHasUnsavedChanges(true)
          }
          break

        case 'Escape':
          // Deselect
          actions.selectNode(undefined)
          break

        case 'ArrowUp':
          if (selectedNodeId && selectedNodeId !== 'ROOT') {
            e.preventDefault()
            actions.setProp(selectedNodeId, (props: Record<string, unknown>) => {
              props.y = ((props.y as number) || 0) - nudgeAmount
            })
            setHasUnsavedChanges(true)
          }
          break

        case 'ArrowDown':
          if (selectedNodeId && selectedNodeId !== 'ROOT') {
            e.preventDefault()
            actions.setProp(selectedNodeId, (props: Record<string, unknown>) => {
              props.y = ((props.y as number) || 0) + nudgeAmount
            })
            setHasUnsavedChanges(true)
          }
          break

        case 'ArrowLeft':
          if (selectedNodeId && selectedNodeId !== 'ROOT') {
            e.preventDefault()
            actions.setProp(selectedNodeId, (props: Record<string, unknown>) => {
              props.x = ((props.x as number) || 0) - nudgeAmount
            })
            setHasUnsavedChanges(true)
          }
          break

        case 'ArrowRight':
          if (selectedNodeId && selectedNodeId !== 'ROOT') {
            e.preventDefault()
            actions.setProp(selectedNodeId, (props: Record<string, unknown>) => {
              props.x = ((props.x as number) || 0) + nudgeAmount
            })
            setHasUnsavedChanges(true)
          }
          break

        case 'z':
        case 'Z':
          // Undo: Ctrl+Z (Cmd+Z on Mac)
          // Redo: Ctrl+Shift+Z (Cmd+Shift+Z on Mac)
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              e.preventDefault()
              actions.history.redo()
            } else {
              e.preventDefault()
              actions.history.undo()
            }
          }
          break

        case 'y':
        case 'Y':
          // Redo: Ctrl+Y (Cmd+Y on Mac)
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            actions.history.redo()
          }
          break

        case 's':
        case 'S':
          // Save: Ctrl+S (Cmd+S on Mac) - this is handled by the topbar component
          // but we prevent default browser behavior here
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            // The actual save is handled by BuilderTopbar
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedNodeId,
    snapEnabled,
    gridSize,
    actions,
    query,
    setHasUnsavedChanges,
    isPreviewMode,
  ])
}
