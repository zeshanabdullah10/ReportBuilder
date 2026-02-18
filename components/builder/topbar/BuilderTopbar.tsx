'use client'

import { useEditor } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { Button } from '@/components/ui/button'
import { Save, Eye, EyeOff, Undo, Redo, ArrowLeft, Trash2, Magnet, Pencil, Check, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { SampleDataLoader } from './SampleDataLoader'

// Autosave delay in milliseconds
const AUTOSAVE_DELAY = 2000

export function BuilderTopbar() {
  const { query, actions } = useEditor()
  const {
    templateId,
    templateName,
    hasUnsavedChanges,
    isPreviewMode,
    togglePreviewMode,
    setHasUnsavedChanges,
    setTemplateName,
    sampleData,
    snapEnabled,
    toggleSnap,
  } = useBuilderStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(templateName)
  const [showSaved, setShowSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  // Sync editName with templateName when it changes externally
  useEffect(() => {
    setEditName(templateName)
  }, [templateName])

  // Save function used by both manual save and autosave
  const saveTemplate = useCallback(async () => {
    if (isSaving || isPreviewMode) return

    setIsSaving(true)
    const serializedState = query.serialize()

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvas_state: JSON.parse(serializedState),
          sample_data: sampleData,
        }),
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        setShowSaved(true)
        setTimeout(() => setShowSaved(false), 2000)
      } else {
        console.error('Save failed')
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, isPreviewMode, query, templateId, sampleData, setHasUnsavedChanges])

  // Autosave effect - trigger save after delay when changes are detected
  useEffect(() => {
    // Clear any existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }

    // If there are unsaved changes and not in preview mode, set autosave timer
    if (hasUnsavedChanges && !isPreviewMode && !isSaving) {
      autosaveTimerRef.current = setTimeout(() => {
        saveTemplate()
      }, AUTOSAVE_DELAY)
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [hasUnsavedChanges, isPreviewMode, isSaving, saveTemplate])

  const handleStartEdit = () => {
    if (isPreviewMode) return
    setEditName(templateName)
    setIsEditingName(true)
  }

  const handleSaveName = async (newName: string) => {
    const trimmedName = newName.trim() || 'Untitled Template'
    setIsEditingName(false)

    if (trimmedName === templateName) return

    setTemplateName(trimmedName)

    // Save to API
    try {
      await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      })
    } catch (error) {
      console.error('Failed to save name:', error)
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName(editName)
    } else if (e.key === 'Escape') {
      setIsEditingName(false)
      setEditName(templateName)
    }
  }

  const handleSave = () => {
    // Clear autosave timer when manually saving
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }
    saveTemplate()
  }

  const handleResetCanvas = () => {
    if (confirm('Are you sure you want to reset the canvas? This will clear all components.')) {
      // Clear and reset to default state with proper Craft.js serialization format
      actions.clearEvents()
      actions.deserialize(
        JSON.stringify({
          ROOT: {
            type: { resolvedName: 'Page' },
            props: { background: 'transparent', padding: 20 },
            nodes: [],
            isCanvas: true,
          },
        })
      )
      setHasUnsavedChanges(true)
    }
  }

  return (
    <header className="h-14 border-b border-[rgba(0,255,200,0.1)] bg-[#050810] flex items-center justify-between px-4 relative z-20">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-[#00ffc8] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => handleSaveName(editName)}
            onKeyDown={handleNameKeyDown}
            className="text-lg font-semibold text-white bg-[rgba(0,255,200,0.1)] border border-[#00ffc8] rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-[#00ffc8]"
            style={{ fontFamily: 'Space Grotesk, sans-serif', minWidth: '150px' }}
          />
        ) : (
          <button
            onClick={handleStartEdit}
            className="group flex items-center gap-1.5 text-lg font-semibold text-white hover:text-[#00ffc8] transition-colors rounded px-1 -mx-1"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            disabled={isPreviewMode}
            title="Click to rename"
          >
            {templateName}
            <Pencil className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#00ffc8] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {hasUnsavedChanges && !isSaving && (
          <span className="text-xs text-[#ffb000] px-2 py-0.5 rounded bg-[rgba(255,176,0,0.1)]">
            Unsaved
          </span>
        )}

        {isSaving && (
          <span className="text-xs text-[#00ffc8] px-2 py-0.5 rounded bg-[rgba(0,255,200,0.1)] flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        )}

        {showSaved && (
          <span className="text-xs text-[#39ff14] px-2 py-0.5 rounded bg-[rgba(57,255,20,0.1)] flex items-center gap-1">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}

        {isPreviewMode && (
          <span className="text-xs text-[#00ffc8] px-2 py-0.5 rounded bg-[rgba(0,255,200,0.1)] flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Preview Mode
          </span>
        )}
      </div>

      {/* Center - Sample Data Controls */}
      <div className="flex items-center gap-2">
        <SampleDataLoader />
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => actions.history.undo()}
          title="Undo"
          disabled={isPreviewMode}
        >
          <Undo className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => actions.history.redo()}
          title="Redo"
          disabled={isPreviewMode}
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-[rgba(0,255,200,0.2)] mx-2" />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleResetCanvas}
          title="Reset Canvas"
          className="text-red-400 hover:text-red-300"
          disabled={isPreviewMode}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <Button
          variant={snapEnabled ? 'primary' : 'ghost'}
          size="icon"
          onClick={toggleSnap}
          title={snapEnabled ? 'Disable snap to grid' : 'Enable snap to grid'}
          disabled={isPreviewMode}
          className={snapEnabled ? 'bg-[#00ffc8] text-[#0a0f14]' : ''}
        >
          <Magnet className="w-4 h-4" />
        </Button>

        <Button
          variant={isPreviewMode ? 'primary' : 'outline'}
          onClick={togglePreviewMode}
          className={isPreviewMode ? 'bg-[#00ffc8] text-[#0a0f14] hover:bg-[#00ffc8]/90' : ''}
        >
          {isPreviewMode ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Exit Preview
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </>
          )}
        </Button>

        <Button
          onClick={handleSave}
          disabled={isSaving || isPreviewMode}
          variant={isPreviewMode ? 'ghost' : 'primary'}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </header>
  )
}
