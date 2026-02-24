'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportModal } from './ExportModal'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { useEditor } from '@craftjs/core'

export function ExportButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const templateId = useBuilderStore((state) => state.templateId)
  const templateName = useBuilderStore((state) => state.templateName)
  const sampleData = useBuilderStore((state) => state.sampleData)
  
  // Get canvas state from Craft.js
  const { query } = useEditor()

  if (!templateId) return null

  // Get serialized canvas state when opening modal
  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  // Get the current canvas state
  const getCanvasState = () => {
    try {
      const serialized = query.serialize()
      return JSON.parse(serialized)
    } catch {
      return null
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenModal}
        className="text-xs"
      >
        <Download className="w-3 h-3 mr-1" />
        Export
      </Button>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        templateId={templateId}
        templateName={templateName}
        canvasState={isModalOpen ? getCanvasState() : null}
        sampleData={sampleData}
      />
    </>
  )
}
