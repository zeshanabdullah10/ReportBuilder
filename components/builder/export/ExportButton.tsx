'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportModal } from './ExportModal'
import { useBuilderStore } from '@/lib/stores/builder-store'

export function ExportButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const templateId = useBuilderStore((state) => state.templateId)
  const templateName = useBuilderStore((state) => state.templateName)

  if (!templateId) return null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
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
      />
    </>
  )
}
