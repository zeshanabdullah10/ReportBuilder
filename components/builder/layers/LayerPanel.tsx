'use client'

import { useEditor } from '@craftjs/core'
import {
  Type,
  Box,
  Image,
  Table,
  BarChart3,
  CircleDot,
  Minus,
  FileText,
  Divide,
  Hash,
  Calendar,
  Gauge,
  Percent,
  List,
  Eye,
  EyeOff,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react'
import { useState } from 'react'

// Map component types to icons
const componentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Text: Type,
  Container: Box,
  Image: Image,
  Table: Table,
  Chart: BarChart3,
  Indicator: CircleDot,
  Spacer: Minus,
  PageBreak: FileText,
  Divider: Divide,
  PageNumber: Hash,
  DateTime: Calendar,
  Gauge: Gauge,
  ProgressBar: Percent,
  BulletList: List,
}

interface LayerItem {
  id: string
  displayName: string
  zIndex: number
  visible: boolean
  componentName: string
}

interface LayerPanelProps {
  standalone?: boolean
}

export function LayerPanel({ standalone = false }: LayerPanelProps) {
  const { actions, query, selectedNodeId } = useEditor((state, query) => {
    const [currentNodeId] = state.events.selected
    return { selectedNodeId: currentNodeId }
  })

  const [isCollapsed, setIsCollapsed] = useState(false)

  // Get all layers sorted by z-index (highest first)
  const getLayers = (): LayerItem[] => {
    const nodes = query.getSerializedNodes()
    const layers: LayerItem[] = []

    Object.entries(nodes).forEach(([id, node]: [string, any]) => {
      // Skip the root Page component
      if (!node.parent) return

      const displayName = node.custom?.displayName || node.displayName || node.type?.resolvedName || 'Component'
      const componentName = node.type?.resolvedName || 'Unknown'

      layers.push({
        id,
        displayName,
        zIndex: node.props?.zIndex || 1,
        visible: node.props?.visible !== false,
        componentName,
      })
    })

    // Sort by z-index (highest first), then by name
    return layers.sort((a, b) => b.zIndex - a.zIndex || a.displayName.localeCompare(b.displayName))
  }

  const layers = getLayers()

  const handleSelectLayer = (id: string) => {
    actions.selectNode(id)
  }

  const handleToggleVisibility = (id: string, currentVisible: boolean) => {
    actions.setProp(id, (props: any) => {
      props.visible = !currentVisible
    })
  }

  const handleBringToFront = (id: string) => {
    const nodes = query.getSerializedNodes()
    let maxZ = 1
    Object.values(nodes).forEach((node: any) => {
      if (node.props?.zIndex && node.props.zIndex > maxZ) {
        maxZ = node.props.zIndex
      }
    })
    actions.setProp(id, (props: any) => {
      props.zIndex = maxZ + 1
    })
  }

  const handleSendToBack = (id: string) => {
    actions.setProp(id, (props: any) => {
      props.zIndex = 1
    })
  }

  // Standalone mode - full height for tab view
  if (standalone) {
    return (
      <div className="flex flex-col h-full">
        {/* Layer list - fills available space */}
        <div className="flex-1 overflow-y-auto">
          {layers.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-gray-500 text-sm mb-2">No components yet</div>
              <div className="text-gray-600 text-xs">Drag components from the toolbox to get started</div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {layers.map((layer) => {
                const Icon = componentIcons[layer.componentName] || Box
                const isSelected = selectedNodeId === layer.id

                return (
                  <div
                    key={layer.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[rgba(0,255,200,0.15)] border border-[rgba(0,255,200,0.3)]'
                        : 'hover:bg-[rgba(0,255,200,0.05)] border border-transparent'
                    }`}
                    onClick={() => handleSelectLayer(layer.id)}
                  >
                    {/* Component icon */}
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-[#00ffc8]' : 'text-gray-500'}`} />

                    {/* Component name */}
                    <span
                      className={`flex-1 text-sm truncate ${
                        isSelected ? 'text-white' : 'text-gray-400'
                      } ${!layer.visible ? 'opacity-50' : ''}`}
                    >
                      {layer.displayName}
                    </span>

                    {/* Z-index badge */}
                    <span className="text-xs text-gray-600 font-mono flex-shrink-0">{layer.zIndex}</span>

                    {/* Action buttons - visible on hover or when selected */}
                    <div className={`flex items-center gap-0.5 flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBringToFront(layer.id)
                        }}
                        className="p-1 rounded hover:bg-[rgba(0,255,200,0.1)]"
                        title="Bring to Front"
                      >
                        <ChevronsUp className="w-3.5 h-3.5 text-gray-500 hover:text-[#00ffc8]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSendToBack(layer.id)
                        }}
                        className="p-1 rounded hover:bg-[rgba(0,255,200,0.1)]"
                        title="Send to Back"
                      >
                        <ChevronsDown className="w-3.5 h-3.5 text-gray-500 hover:text-[#00ffc8]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleVisibility(layer.id, layer.visible)
                        }}
                        className="p-1 rounded hover:bg-[rgba(0,255,200,0.1)]"
                        title={layer.visible ? 'Hide' : 'Show'}
                      >
                        {layer.visible ? (
                          <Eye className="w-3.5 h-3.5 text-[#00ffc8]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Collapsible mode for inline use
  if (isCollapsed) {
    return (
      <div className="border-b border-[rgba(0,255,200,0.1)]">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full p-3 flex items-center justify-between hover:bg-[rgba(0,255,200,0.05)]"
        >
          <span className="text-xs text-gray-500 uppercase tracking-wide">Layers</span>
          <span className="text-xs text-gray-500">{layers.length}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="border-b border-[rgba(0,255,200,0.1)]">
      <button
        onClick={() => setIsCollapsed(true)}
        className="w-full p-3 flex items-center justify-between hover:bg-[rgba(0,255,200,0.05)]"
      >
        <span className="text-xs text-gray-500 uppercase tracking-wide">Layers</span>
        <span className="text-xs text-gray-500">{layers.length} items</span>
      </button>

      <div className="max-h-64 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500">
            No components yet
          </div>
        ) : (
          <div className="space-y-0.5 px-2 pb-2">
            {layers.map((layer) => {
              const Icon = componentIcons[layer.componentName] || Box
              const isSelected = selectedNodeId === layer.id

              return (
                <div
                  key={layer.id}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[rgba(0,255,200,0.15)] border border-[rgba(0,255,200,0.3)]'
                      : 'hover:bg-[rgba(0,255,200,0.05)] border border-transparent'
                  }`}
                  onClick={() => handleSelectLayer(layer.id)}
                >
                  {/* Component icon */}
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#00ffc8]' : 'text-gray-500'}`} />

                  {/* Component name */}
                  <span
                    className={`flex-1 text-sm truncate ${
                      isSelected ? 'text-white' : 'text-gray-400'
                    } ${!layer.visible ? 'opacity-50' : ''}`}
                  >
                    {layer.displayName}
                  </span>

                  {/* Z-index badge */}
                  <span className="text-xs text-gray-600 font-mono">{layer.zIndex}</span>

                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleVisibility(layer.id, layer.visible)
                    }}
                    className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      !layer.visible ? 'opacity-100' : ''
                    }`}
                    title={layer.visible ? 'Hide' : 'Show'}
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5 text-[#00ffc8]" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
