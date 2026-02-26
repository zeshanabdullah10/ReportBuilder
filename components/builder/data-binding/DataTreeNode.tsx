'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Hash, Braces, FileText, ToggleLeft, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataPathInfo, DataType } from '@/lib/utils/data-paths'
import { DataBindingBadge } from './DataBindingBadge'

interface DataTreeNodeProps {
  node: DataPathInfo
  onSelect: (path: string) => void
  selectedPath?: string
  showValues?: boolean
  filterType?: DataType
  level?: number
}

const TYPE_ICONS: Record<DataType, React.ReactNode> = {
  string: <FileText className="w-3 h-3 text-[#00ffc8]" />,
  number: <Hash className="w-3 h-3 text-[#39ff14]" />,
  boolean: <ToggleLeft className="w-3 h-3 text-[#ffb000]" />,
  array: <List className="w-3 h-3 text-[#ff6b6b]" />,
  object: <Braces className="w-3 h-3 text-[#9b59b6]" />,
  null: <span className="w-3 h-3 text-gray-500">∅</span>,
  undefined: <span className="w-3 h-3 text-gray-500">?</span>,
}

export function DataTreeNode({
  node,
  onSelect,
  selectedPath,
  showValues = false,
  filterType,
  level = 0,
}: DataTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)

  const hasChildren = node.children && node.children.length > 0
  const isContainer = node.type === 'object' || node.type === 'array'
  const isSelected = selectedPath === node.path

  // Check if this node matches the filter type
  const matchesFilter = !filterType || node.type === filterType || isContainer

  // For containers, check if any descendant matches the filter
  const hasMatchingDescendant = (items: DataPathInfo[]): boolean => {
    if (!filterType) return true
    return items.some(
      (item) =>
        item.type === filterType ||
        (item.children && item.children.length > 0 && hasMatchingDescendant(item.children))
    )
  }

  // Don't render if doesn't match filter
  if (!matchesFilter && isContainer && node.children && !hasMatchingDescendant(node.children)) {
    return null
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Only allow selecting non-container types (leaf values)
    if (!isContainer) {
      onSelect(node.path)
    }
  }

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer group',
          'hover:bg-[rgba(0,255,200,0.1)]',
          isSelected && 'bg-[rgba(0,255,200,0.2)] text-[#00ffc8]'
        )}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={handleSelect}
      >
        {/* Expand/collapse button for containers */}
        {isContainer ? (
          <button
            type="button"
            onClick={handleToggle}
            className="p-0.5 hover:bg-[rgba(0,255,200,0.2)] rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Type icon */}
        <span className="flex-shrink-0">{TYPE_ICONS[node.type]}</span>

        {/* Key name */}
        <span
          className={cn(
            'font-mono text-xs flex-shrink-0',
            isContainer ? 'text-gray-300' : 'text-white'
          )}
        >
          {node.key}
        </span>

        {/* Type badge */}
        <DataBindingBadge type={node.type} compact className="ml-1" />

        {/* Child count for containers */}
        {isContainer && node.childCount !== undefined && (
          <span className="text-[10px] text-gray-500 ml-1">({node.childCount})</span>
        )}

        {/* Value preview */}
        {showValues && node.preview && !isContainer && (
          <span className="text-[10px] text-gray-500 ml-auto truncate max-w-[120px]">
            {node.preview}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <DataTreeNode
              key={child.path}
              node={child}
              onSelect={onSelect}
              selectedPath={selectedPath}
              showValues={showValues}
              filterType={filterType}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
