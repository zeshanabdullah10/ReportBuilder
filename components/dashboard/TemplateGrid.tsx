'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, ArrowUpDown, FileText } from 'lucide-react'
import { TemplateCard } from './TemplateCard'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  canvas_state?: Record<string, unknown> | null
  componentCount?: number
}

type SortOption = 'updated' | 'created' | 'name'

interface TemplateGridProps {
  templates: Template[]
}

export function TemplateGrid({ templates: initialTemplates }: TemplateGridProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('updated')
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    templateId: string | null
    templateName: string
    isDeleting: boolean
  }>({
    isOpen: false,
    templateId: null,
    templateName: '',
    isDeleting: false,
  })
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let result = [...templates]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

    return result
  }, [templates, searchQuery, sortBy])

  // Handle delete click
  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteDialog({
      isOpen: true,
      templateId: id,
      templateName: name,
      isDeleting: false,
    })
  }, [])

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.templateId) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      const response = await fetch(`/api/templates/${deleteDialog.templateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      // Remove from local state
      setTemplates((prev) => prev.filter((t) => t.id !== deleteDialog.templateId))
      setDeleteDialog({
        isOpen: false,
        templateId: null,
        templateName: '',
        isDeleting: false,
      })
    } catch (error) {
      console.error('Delete error:', error)
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
      // Could add toast notification here
    }
  }, [deleteDialog.templateId])

  // Handle delete cancel
  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({
      isOpen: false,
      templateId: null,
      templateName: '',
      isDeleting: false,
    })
  }, [])

  // Handle duplicate
  const handleDuplicate = useCallback(async (id: string) => {
    setDuplicatingId(id)

    try {
      const response = await fetch(`/api/templates/${id}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate template')
      }

      const newTemplate = await response.json()

      // Add to local state
      setTemplates((prev) => [newTemplate, ...prev])
    } catch (error) {
      console.error('Duplicate error:', error)
      // Could add toast notification here
    } finally {
      setDuplicatingId(null)
    }
  }, [])

  return (
    <div>
      {/* Search and Sort Controls */}
      {templates.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[rgba(0,255,200,0.5)] focus:ring-1 focus:ring-[rgba(0,255,200,0.3)]"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="pl-10 pr-8 py-2 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-[rgba(0,255,200,0.5)] focus:ring-1 focus:ring-[rgba(0,255,200,0.3)]"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="name">Name</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {templates.length === 0 ? (
        <Card className="border-dashed border-[rgba(0,255,200,0.3)]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-[#00ffc8]/30 mb-4" />
            <p className="text-gray-400 mb-4">You haven&apos;t created any templates yet.</p>
            <Link href="/dashboard/new">
              <Button>Create your first template</Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        /* No search results */
        <Card className="border-dashed border-[rgba(0,255,200,0.3)]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-[#00ffc8]/30 mb-4" />
            <p className="text-gray-400 mb-2">No templates match your search.</p>
            <p className="text-gray-500 text-sm">Try a different search term.</p>
          </CardContent>
        </Card>
      ) : (
        /* Template Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={handleDeleteClick}
              onDuplicate={handleDuplicate}
              isDuplicating={duplicatingId === template.id}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        templateName={deleteDialog.templateName}
        isDeleting={deleteDialog.isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}
