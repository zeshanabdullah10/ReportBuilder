'use client'

import React, { useState, useMemo } from 'react'
import { useEditor } from '@craftjs/core'
import { Trash2, AlertTriangle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { getBindingStatus, hasBindings } from '@/lib/utils/binding'
import { DataType } from '@/lib/utils/data-paths'

// Mapping of component types to their binding properties and expected types
const BINDING_CONFIGS: Record<string, Array<{ prop: string; expectedType?: DataType; label: string }>> = {
  Chart: [
    { prop: 'binding', expectedType: 'array', label: 'Data' },
    { prop: 'labelsBinding', expectedType: 'array', label: 'Labels' },
  ],
  Table: [
    { prop: 'binding', expectedType: 'array', label: 'Data' },
  ],
  Text: [
    { prop: 'text', expectedType: 'string', label: 'Text' },
  ],
  Indicator: [
    { prop: 'binding', expectedType: 'boolean', label: 'Status' },
  ],
  Image: [
    { prop: 'src', expectedType: 'string', label: 'Source' },
  ],
  ScatterPlot: [
    { prop: 'binding', expectedType: 'array', label: 'Data' },
  ],
  Histogram: [
    { prop: 'binding', expectedType: 'array', label: 'Data' },
  ],
  BulletList: [
    { prop: 'binding', expectedType: 'array', label: 'Items' },
  ],
}

export function SettingsPanel() {
  const { sampleData } = useBuilderStore()

  const { selected, actions, query } = useEditor((state, query) => {
    const [currentNodeId] = state.events.selected
    let selected = null

    if (currentNodeId) {
      const node = state.nodes[currentNodeId]
      // A node is the root if it has no parent
      const isRoot = !node.data.parent
      // Use Craft.js built-in isDeletable check
      const isDeletable = query.node(currentNodeId).isDeletable()

      selected = {
        id: currentNodeId,
        name: node.data.custom?.displayName || node.data.displayName,
        settings: node.related?.settings,
        isDeletable: isDeletable && !isRoot, // Never allow deleting root
        props: node.data.props,
      }
    }

    return { selected }
  })

  // Analyze binding health for the selected component
  const bindingHealth = useMemo(() => {
    if (!selected?.props) return null

    const componentName = selected.name
    const config = BINDING_CONFIGS[componentName]
    if (!config) return null

    const issues: Array<{ label: string; prop: string; status: ReturnType<typeof getBindingStatus> }> = []

    for (const { prop, expectedType, label } of config) {
      const value = (selected.props as Record<string, unknown>)[prop]
      if (typeof value === 'string' && hasBindings(value)) {
        const status = getBindingStatus(value, sampleData, expectedType)
        if (!status.isValid || status.isUsingFallback) {
          issues.push({ label, prop, status })
        }
      }
    }

    return issues.length > 0 ? issues : null
  }, [selected, sampleData])

  const handleDelete = () => {
    if (selected && selected.isDeletable) {
      // Double-check using query before deleting
      if (query.node(selected.id).isDeletable()) {
        actions.delete(selected.id)
      }
    }
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-[rgba(0,255,200,0.1)]">
          <h3
            className="text-sm font-semibold text-[#00ffc8] uppercase tracking-wider"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Properties
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!selected ? (
            <p className="text-gray-500 text-sm">
              Click on a component to edit its properties
            </p>
          ) : (
            <div className="space-y-4">
              <div className="pb-3 border-b border-[rgba(0,255,200,0.1)]">
                <span className="text-white font-medium">{selected.name}</span>
              </div>

              {/* Binding Health Summary */}
              {bindingHealth && (
                <div className="bg-[#0a0f14] border border-[rgba(255,140,0,0.3)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[#ff8c00]">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Binding Issues
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {bindingHealth.map((issue, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-xs"
                      >
                        {issue.status.error?.includes('Type mismatch') ? (
                          <AlertCircle className="w-3 h-3 text-[#ff8c00] mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-[#ffb000] mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-gray-300">
                          <span className="text-gray-500">{issue.label}:</span>{' '}
                          {issue.status.error || 'Using fallback data'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.settings && (
                <div className="space-y-4">
                  {React.createElement(selected.settings)}
                </div>
              )}

              {selected.isDeletable && (
                <div className="pt-4 border-t border-[rgba(0,255,200,0.1)]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Component
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
