'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TemplateGrid } from './TemplateGrid'
import { BatchExportDialog } from './BatchExportDialog'

interface Template {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  canvas_state?: Record<string, unknown> | null
  componentCount?: number
}

interface DashboardContentProps {
  templates: Template[]
}

export function DashboardContent({ templates }: DashboardContentProps) {
  const [showBatchExport, setShowBatchExport] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-semibold text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Your Templates
        </h2>
        
        {templates.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBatchExport(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Batch Export
          </Button>
        )}
      </div>

      <TemplateGrid templates={templates} />

      <BatchExportDialog
        templates={templates}
        isOpen={showBatchExport}
        onClose={() => setShowBatchExport(false)}
      />
    </>
  )
}
