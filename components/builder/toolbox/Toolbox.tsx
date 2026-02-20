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

// Default expanded categories
const defaultExpanded = ['Document', 'Charts & Data']

export function Toolbox() {
  const { connectors } = useEditor()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([...defaultExpanded, 'Custom Components'])
  )

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  return (
    <div className="h-full flex flex-col border-r border-[rgba(0,255,200,0.15)]" role="region" aria-label="Component toolbox">
      <div className="p-4 border-b border-[rgba(0,255,200,0.1)]">
        <h3
          id="toolbox-title"
          className="text-sm font-semibold text-[#00ffc8] uppercase tracking-wider"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Components
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="py-2" role="list" aria-labelledby="toolbox-title">
          {toolboxItems.map((category) => {
            const isExpanded = expandedCategories.has(category.category)
            return (
              <div key={category.category} role="group" aria-label={category.category + ' components'}>
                <button
                  onClick={() => toggleCategory(category.category)}
                  className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider font-medium w-full px-4 py-2 hover:text-gray-400 hover:bg-[rgba(0,255,200,0.03)] transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  {category.category}
                  <span className="ml-auto text-[10px] text-gray-600">
                    {category.items.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-2 space-y-1.5" role="list">
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
                        className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all bg-[rgba(0,255,200,0.03)] border border-[rgba(0,255,200,0.1)] hover:bg-[rgba(0,255,200,0.08)] hover:border-[rgba(0,255,200,0.25)] focus:ring-2 focus:ring-[#00ffc8] focus:ring-offset-1 focus:ring-offset-[#0a0f14] group"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#00ffc8] transition-colors flex-shrink-0" aria-hidden="true" />
                        <item.icon className="w-4 h-4 text-[#00ffc8] flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-gray-300 block">{item.name}</span>
                          <span className="text-[10px] text-gray-600 truncate block">{item.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Custom Components Section */}
          <div role="group" aria-label="Custom components" className="border-t border-[rgba(0,255,200,0.1)] mt-2">
            <button
              onClick={() => toggleCategory('Custom Components')}
              className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider font-medium w-full px-4 py-2 hover:text-gray-400 hover:bg-[rgba(0,255,200,0.03)] transition-colors"
            >
              {expandedCategories.has('Custom Components') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Bookmark className="w-4 h-4" />
              Custom Components
            </button>

            {expandedCategories.has('Custom Components') && (
              <div className="px-3 pb-2">
                <div className="border border-[rgba(0,255,200,0.1)] rounded-lg overflow-hidden">
                  <CustomComponentsPanel />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
