'use client'

import { useState, useEffect } from 'react'
import { useEditor, Element } from '@craftjs/core'
import { Loader2, Trash2, Plus, Search, Star, Users } from 'lucide-react'
import { Text } from '../components/Text'
import { Container } from '../components/Container'
import { Image } from '../components/Image'
import { Table } from '../components/Table'
import { Chart } from '../components/Chart'
import { Spacer } from '../components/Spacer'
import { PageBreak } from '../components/PageBreak'
import { Indicator } from '../components/Indicator'
import { Divider } from '../components/Divider'
import { PageNumber } from '../components/PageNumber'
import { DateTime } from '../components/DateTime'
import { Gauge } from '../components/Gauge'
import { ProgressBar } from '../components/ProgressBar'
import { BulletList } from '../components/BulletList'

interface CustomComponent {
  id: string
  name: string
  description: string | null
  category: string
  component_type: string
  config: {
    props: Record<string, unknown>
    custom?: Record<string, unknown>
  }
  thumbnail_url: string | null
  is_public: boolean
  usage_count: number
  created_at: string
}

interface CustomComponentsPanelProps {
  onClose?: () => void
}

export function CustomComponentsPanel({ onClose }: CustomComponentsPanelProps) {
  const [components, setComponents] = useState<CustomComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showPublic, setShowPublic] = useState(false)

  const { actions, query } = useEditor()

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'custom', label: 'Custom' },
    { value: 'indicators', label: 'Indicators' },
    { value: 'charts', label: 'Charts' },
    { value: 'tables', label: 'Tables' },
    { value: 'text', label: 'Text' },
    { value: 'containers', label: 'Containers' },
  ]

  useEffect(() => {
    fetchComponents()
  }, [showPublic, selectedCategory])

  const fetchComponents = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      if (showPublic) {
        params.append('public', 'true')
      }

      const response = await fetch(`/api/components?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch components')
      }

      const data = await response.json()
      setComponents(data.components || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load components')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return

    try {
      const response = await fetch(`/api/components/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete component')
      }

      setComponents(components.filter((c) => c.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete component')
    }
  }

  const handleAddToCanvas = (component: CustomComponent) => {
    const props = component.config.props || {}

    // Create element and add to canvas
    // Use createElement approach compatible with craft.js
    const element = (() => {
      switch (component.component_type) {
        case 'Container':
          return <Element is={Container} {...props} canvas />
        case 'Text':
          return <Text {...props} />
        case 'Image':
          return <Image {...props} />
        case 'Table':
          return <Table {...props} />
        case 'Chart':
          return <Chart {...props} />
        case 'Spacer':
          return <Spacer {...props} />
        case 'PageBreak':
          return <PageBreak {...props} />
        case 'Indicator':
          return <Indicator {...props} />
        case 'Divider':
          return <Divider {...props} />
        case 'PageNumber':
          return <PageNumber {...props} />
        case 'DateTime':
          return <DateTime {...props} />
        case 'Gauge':
          return <Gauge {...props} />
        case 'ProgressBar':
          return <ProgressBar {...props} />
        case 'BulletList':
          return <BulletList {...props} />
        default:
          return null
      }
    })()

    if (element) {
      // Add to the ROOT node using the correct type
      actions.add(element as any, 'ROOT')
    }

    // Increment usage count
    fetch(`/api/components/${component.id}/usage`, { method: 'POST' }).catch(() => {})

    onClose?.()
  }

  const filteredComponents = components.filter((c) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(query) ||
      (c.description?.toLowerCase().includes(query)) ||
      c.component_type.toLowerCase().includes(query)
    )
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-[rgba(0,255,200,0.1)]">
        <h3 className="text-sm font-medium text-white mb-3">Custom Components</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg pl-8 pr-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#00ffc8]"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#00ffc8]"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={showPublic}
            onChange={(e) => setShowPublic(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[rgba(0,255,200,0.2)] bg-[#050810] text-[#00ffc8]"
          />
          <Users className="w-3.5 h-3.5" />
          Include public components
        </label>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#00ffc8]" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-400 text-sm">{error}</div>
        ) : filteredComponents.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchQuery ? 'No components match your search' : 'No custom components yet'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredComponents.map((component) => (
              <div
                key={component.id}
                className="group p-2 bg-[#050810] border border-[rgba(0,255,200,0.1)] rounded-lg hover:border-[rgba(0,255,200,0.3)] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white truncate">
                        {component.name}
                      </span>
                      {component.is_public && (
                        <span className="px-1.5 py-0.5 bg-[#00ffc8]/10 text-[#00ffc8] text-[10px] rounded">
                          Public
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {component.component_type}
                      {component.usage_count > 0 && (
                        <span className="ml-2">
                          <Star className="w-3 h-3 inline mr-0.5" />
                          {component.usage_count}
                        </span>
                      )}
                    </div>
                    {component.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {component.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleAddToCanvas(component)}
                      className="p-1 text-[#00ffc8] hover:bg-[#00ffc8]/10 rounded transition-colors"
                      title="Add to canvas"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(component.id)}
                      className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
