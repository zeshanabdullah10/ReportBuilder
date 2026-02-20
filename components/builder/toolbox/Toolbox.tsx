'use client'

import { useState } from 'react'
import { useEditor, Element } from '@craftjs/core'
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
import { CustomComponentsPanel } from '../custom/CustomComponentsPanel'
import {
  Type, Square, Image as ImageIcon, Table2, BarChart3, Minus,
  FileText, GripVertical, CheckCircle, Divide, Hash, Calendar,
  Gauge as GaugeIcon, Loader, List, Bookmark, ChevronDown, ChevronRight
} from 'lucide-react'

const toolboxItems = [
  // Document Structure
  {
    category: 'Document',
    items: [
      {
        name: 'Text',
        icon: Type,
        component: <Text />,
        description: 'Add text with styling',
      },
      {
        name: 'List',
        icon: List,
        component: <BulletList />,
        description: 'Bulleted or numbered list',
      },
      {
        name: 'Image',
        icon: ImageIcon,
        component: <Image />,
        description: 'Add an image',
      },
      {
        name: 'Container',
        icon: Square,
        component: <Element is={Container} canvas />,
        description: 'Group components together',
      },
    ],
  },
  // Data Visualization
  {
    category: 'Charts & Data',
    items: [
      {
        name: 'Chart',
        icon: BarChart3,
        component: <Chart />,
        description: 'Bar, line, or pie chart',
      },
      {
        name: 'Table',
        icon: Table2,
        component: <Table />,
        description: 'Add a data table',
      },
      {
        name: 'Gauge',
        icon: GaugeIcon,
        component: <Gauge />,
        description: 'Value within a range',
      },
      {
        name: 'Progress Bar',
        icon: Loader,
        component: <ProgressBar />,
        description: 'Completion percentage',
      },
      {
        name: 'Indicator',
        icon: CheckCircle,
        component: <Indicator />,
        description: 'Pass/Fail status badge',
      },
    ],
  },
  // Layout & Structure
  {
    category: 'Layout',
    items: [
      {
        name: 'Divider',
        icon: Divide,
        component: <Divider />,
        description: 'Horizontal or vertical line',
      },
      {
        name: 'Spacer',
        icon: Minus,
        component: <Spacer />,
        description: 'Add vertical spacing',
      },
      {
        name: 'Page Break',
        icon: FileText,
        component: <PageBreak />,
        description: 'Force a new page',
      },
    ],
  },
  // Page Elements
  {
    category: 'Page Elements',
    items: [
      {
        name: 'Page Number',
        icon: Hash,
        component: <PageNumber />,
        description: 'Auto page numbering',
      },
      {
        name: 'Date/Time',
        icon: Calendar,
        component: <DateTime />,
        description: 'Formatted timestamp',
      },
    ],
  },
]

export function Toolbox() {
  const { connectors } = useEditor()
  const [showCustom, setShowCustom] = useState(false)

  return (
    <div className="h-full flex flex-col" role="region" aria-label="Component toolbox">
      <div className="p-4">
        <h3
          id="toolbox-title"
          className="text-sm font-semibold text-[#00ffc8] mb-4 uppercase tracking-wider"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Components
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-6" role="list" aria-labelledby="toolbox-title">
          {toolboxItems.map((category) => (
            <div key={category.category} role="group" aria-label={category.category + ' components'}>
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                {category.category}
              </h4>
              <div className="space-y-2" role="list">
                {category.items.map((item) => (
                  <div
                    key={item.name}
                    ref={(ref) => {
                      if (ref && item.component) {
                        connectors.create(ref, item.component)
                      }
                    }}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`Drag ${item.name}: ${item.description}`}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all bg-[rgba(0,255,200,0.05)] border border-[rgba(0,255,200,0.15)] hover:bg-[rgba(0,255,200,0.1)] hover:border-[rgba(0,255,200,0.3)] focus:ring-2 focus:ring-[#00ffc8] focus:ring-offset-2 focus:ring-offset-[#0a0f14] group"
                  >
                    <GripVertical className="w-4 h-4 text-gray-500 group-hover:text-[#00ffc8] transition-colors" aria-hidden="true" />
                    <item.icon className="w-5 h-5 text-[#00ffc8]" aria-hidden="true" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-300 block">{item.name}</span>
                      <span className="text-xs text-gray-500">{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Custom Components Section */}
          <div role="group" aria-label="Custom components">
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium w-full hover:text-gray-400 transition-colors"
            >
              {showCustom ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Bookmark className="w-4 h-4" />
              Custom Components
            </button>

            {showCustom && (
              <div className="mt-2 border border-[rgba(0,255,200,0.1)] rounded-lg overflow-hidden">
                <CustomComponentsPanel />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
