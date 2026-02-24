'use client'

import { useState } from 'react'
import { Settings, Layers } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'
import { LayerPanel } from '../layers/LayerPanel'

type Tab = 'properties' | 'layers'

export function RightSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('properties')

  return (
    <div className="flex flex-col h-full border-l-2 border-[#00ffc8]">
      {/* Tab Header */}
      <div className="flex border-b border-[rgba(0,255,200,0.1)]">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'properties'
              ? 'text-[#00ffc8] border-b-2 border-[#00ffc8] bg-[rgba(0,255,200,0.05)]'
              : 'text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.02)]'
          }`}
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          <Settings className="w-4 h-4" />
          Properties
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'layers'
              ? 'text-[#00ffc8] border-b-2 border-[#00ffc8] bg-[rgba(0,255,200,0.05)]'
              : 'text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.02)]'
          }`}
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          <Layers className="w-4 h-4" />
          Layers
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'properties' && (
          <div className="h-full overflow-y-auto">
            <SettingsPanel />
          </div>
        )}
        {activeTab === 'layers' && (
          <div className="h-full overflow-y-auto">
            <LayerPanel standalone />
          </div>
        )}
      </div>
    </div>
  )
}
