'use client'

import { useState, useMemo } from 'react'
import { Search, Database, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataPathInfo, DataType, searchPaths } from '@/lib/utils/data-paths'
import { DataTreeNode } from './DataTreeNode'

interface DataTreeProps {
  data: DataPathInfo[] | null
  onSelect: (path: string) => void
  selectedPath?: string
  showValues?: boolean
  filterType?: DataType
  className?: string
  maxHeight?: string
}

export function DataTree({
  data,
  onSelect,
  selectedPath,
  showValues = true,
  filterType,
  className,
  maxHeight = '300px',
}: DataTreeProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter paths based on search query
  const filteredPaths = useMemo(() => {
    if (!data) return null

    if (!searchQuery.trim()) return data

    return searchPaths(data, searchQuery)
  }, [data, searchQuery])

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Database className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No sample data loaded</p>
        <p className="text-xs text-gray-600 mt-1">Load sample data to see available bindings</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Search input */}
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search paths..."
          className={cn(
            'w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-md pl-7 pr-2 py-1.5',
            'text-white text-xs placeholder:text-gray-600',
            'focus:outline-none focus:border-[rgba(0,255,200,0.5)]'
          )}
        />
      </div>

      {/* Tree view */}
      <div
        className="overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        style={{ maxHeight }}
      >
        {filteredPaths && filteredPaths.length > 0 ? (
          <div className="space-y-0.5">
            {filteredPaths.map((node) => (
              <DataTreeNode
                key={node.path}
                node={node}
                onSelect={onSelect}
                selectedPath={selectedPath}
                showValues={showValues}
                filterType={filterType}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-4 text-gray-500 text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>No paths match "{searchQuery}"</span>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-2 pt-2 border-t border-[rgba(0,255,200,0.1)]">
        <p className="text-[10px] text-gray-600 text-center">
          Click a value to insert as binding
        </p>
      </div>
    </div>
  )
}
