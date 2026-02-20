'use client'

import React, { useState } from 'react'
import { useEditor } from '@craftjs/core'
import { Trash2, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LayerControls } from './LayerControls'
import { SaveComponentDialog } from '../custom/SaveComponentDialog'

export function SettingsPanel() {
  const [showSaveDialog, setShowSaveDialog] = useState(false)

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
      <div className="p-4">
        <h3
          className="text-sm font-semibold text-[#00ffc8] mb-4 uppercase tracking-wider"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Properties
        </h3>

        {!selected ? (
          <p className="text-gray-500 text-sm">
            Click on a component to edit its properties
          </p>
        ) : (
          <div className="space-y-4">
            <div className="pb-3 border-b border-[rgba(0,255,200,0.1)]">
              <span className="text-white font-medium">{selected.name}</span>
            </div>

            {selected.settings && (
              <div className="space-y-4">
                {React.createElement(selected.settings)}
              </div>
            )}

            {/* Layer Controls */}
            <div className="pt-4 border-t border-[rgba(0,255,200,0.1)]">
              <LayerControls />
            </div>

            {/* Save as Custom Component */}
            {selected.isDeletable && (
              <div className="pt-4 border-t border-[rgba(0,255,200,0.1)]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  className="w-full text-[#00ffc8] border-[rgba(0,255,200,0.3)] hover:bg-[rgba(0,255,200,0.1)]"
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save as Component
                </Button>
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

      {/* Save Component Dialog */}
      {selected && showSaveDialog && (
        <SaveComponentDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          componentId={selected.id}
        />
      )}
    </>
  )
}
