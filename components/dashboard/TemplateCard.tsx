'use client'

import Link from 'next/link'
import { Edit2, Download, Copy, Trash2, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Template {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  canvas_state?: Record<string, unknown> | null
  componentCount?: number
}

interface TemplateCardProps {
  template: Template
  onDelete: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  isDuplicating?: boolean
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }
}

function countComponents(canvasState: Record<string, unknown> | null | undefined): number {
  if (!canvasState || typeof canvasState !== 'object' || Array.isArray(canvasState)) return 0

  // Craft.js stores nodes in the 'nodes' property or directly in the object
  const nodes = canvasState.nodes ||
    (canvasState.STATE as Record<string, unknown> | undefined)?.nodes ||
    canvasState

  if (typeof nodes === 'object' && nodes !== null && !Array.isArray(nodes)) {
    // Count all node IDs (excluding the root node usually called 'ROOT' or similar)
    const nodesObj = nodes as Record<string, unknown>
    const nodeIds = Object.keys(nodesObj)
    // Filter out system nodes
    return nodeIds.filter(id => {
      const node = nodesObj[id]
      // Count actual component nodes, not just the canvas root
      return node && typeof node === 'object' && !Array.isArray(node) &&
        (node as Record<string, unknown>).displayName !== 'Page'
    }).length
  }

  return 0
}

export function TemplateCard({
  template,
  onDelete,
  onDuplicate,
  isDuplicating = false,
}: TemplateCardProps) {
  const componentCount = template.componentCount ?? countComponents(template.canvas_state)

  return (
    <Card className="hover:shadow-[0_0_30px_rgba(0,255,200,0.15)] transition-all duration-300 group">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg truncate" title={template.name}>
          {template.name}
        </CardTitle>
        <p className="text-sm text-gray-400 truncate" title={template.description || 'No description'}>
          {template.description || 'No description'}
        </p>
      </CardHeader>
      <CardContent>
        {/* Meta Info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            {componentCount} component{componentCount !== 1 ? 's' : ''}
          </span>
          <span>Updated {formatDate(template.updated_at)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/builder/${template.id}`} className="flex-1">
            <Button variant="outline" className="w-full gap-1.5">
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Button>
          </Link>
          <Link href={`/api/templates/${template.id}/download`} className="flex-1">
            <Button variant="outline" className="w-full gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-gray-400 hover:text-[#00ffc8]"
            onClick={() => onDuplicate(template.id)}
            disabled={isDuplicating}
          >
            {isDuplicating ? (
              <span className="flex items-center gap-1.5">
                <svg
                  className="animate-spin h-3.5 w-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Copying...
              </span>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Duplicate
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            onClick={() => onDelete(template.id, template.name)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
