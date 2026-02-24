'use client'

import { useState } from 'react'
import { useNode } from '@craftjs/core'
import { X, Save, Loader2 } from 'lucide-react'

interface SaveComponentDialogProps {
  isOpen: boolean
  onClose: () => void
  componentId: string
}

export function SaveComponentDialog({ isOpen, onClose, componentId }: SaveComponentDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('custom')
  const [isPublic, setIsPublic] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { node } = useNode((node) => ({
    node,
  }))

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for the component')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Get the component's props from the node
      const componentProps = node.data.props
      const componentType = node.data.custom?.displayName || node.data.name || 'Unknown'

      const response = await fetch('/api/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          component_type: componentType,
          config: {
            props: componentProps,
            custom: node.data.custom,
          },
          is_public: isPublic,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save component')
      }

      // Reset form and close
      setName('')
      setDescription('')
      setCategory('custom')
      setIsPublic(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save component')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,255,200,0.1)]">
          <h2 className="text-lg font-semibold text-white">Save as Custom Component</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Component Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Component"
              className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ffc8]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this component does..."
              rows={3}
              className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ffc8] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ffc8]"
            >
              <option value="custom">Custom</option>
              <option value="indicators">Indicators</option>
              <option value="charts">Charts</option>
              <option value="tables">Tables</option>
              <option value="text">Text Elements</option>
              <option value="containers">Containers</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.2)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-400">
              Make this component public (visible to other users)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-[rgba(0,255,200,0.1)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[#00ffc8] text-[#0a0f14] rounded-lg text-sm font-medium hover:bg-[#00ffc8]/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Component
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
