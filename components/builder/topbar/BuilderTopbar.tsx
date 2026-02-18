'use client'

import { useEditor } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { Button } from '@/components/ui/button'
import { Save, Eye, EyeOff, Undo, Redo, ArrowLeft, Trash2, Magnet } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { SampleDataLoader } from './SampleDataLoader'

export function BuilderTopbar() {
  const { query, actions } = useEditor()
  const {
    templateId,
    templateName,
    hasUnsavedChanges,
    isPreviewMode,
    togglePreviewMode,
    setHasUnsavedChanges,
    sampleData,
    snapEnabled,
    toggleSnap,
  } = useBuilderStore()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
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
      } else {
        console.error('Save failed')
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
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

        <h1
          className="text-lg font-semibold text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          {templateName}
        </h1>

        {hasUnsavedChanges && (
          <span className="text-xs text-[#ffb000] px-2 py-0.5 rounded bg-[rgba(255,176,0,0.1)]">
            Unsaved
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
