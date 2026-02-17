'use client'

import { useEditor, Element } from '@craftjs/core'
import { Text } from '../components/Text'
import { Container } from '../components/Container'
import { Image } from '../components/Image'
import { Table } from '../components/Table'
import { Chart } from '../components/Chart'
import { Spacer } from '../components/Spacer'
import { PageBreak } from '../components/PageBreak'
import { Indicator } from '../components/Indicator'
import { Type, Square, Image as ImageIcon, Table2, BarChart3, Minus, FileText, GripVertical, CheckCircle } from 'lucide-react'

const toolboxItems = [
  {
    name: 'Text',
    icon: Type,
    component: <Text />,
    description: 'Add text with styling',
  },
  {
    name: 'Container',
    icon: Square,
    component: <Element is={Container} canvas />,
    description: 'Group components together',
  },
  {
    name: 'Image',
    icon: ImageIcon,
    component: <Image />,
    description: 'Add an image',
  },
  {
    name: 'Table',
    icon: Table2,
    component: <Table />,
    description: 'Add a data table',
  },
  {
    name: 'Chart',
    icon: BarChart3,
    component: <Chart />,
    description: 'Add a chart visualization',
  },
  {
    name: 'Indicator',
    icon: CheckCircle,
    component: <Indicator />,
    description: 'Pass/Fail status badge',
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
]

export function Toolbox() {
  const { connectors } = useEditor()

  return (
    <div className="p-4">
      <h3
        className="text-sm font-semibold text-[#00ffc8] mb-4 uppercase tracking-wider"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Components
      </h3>

      <div className="space-y-2">
        {toolboxItems.map((item) => (
          <div
            key={item.name}
            ref={(ref) => {
              if (ref && item.component) {
                connectors.create(ref, item.component)
              }
            }}
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all bg-[rgba(0,255,200,0.05)] border border-[rgba(0,255,200,0.15)] hover:bg-[rgba(0,255,200,0.1)] hover:border-[rgba(0,255,200,0.3)] group"
          >
            <GripVertical className="w-4 h-4 text-gray-500 group-hover:text-[#00ffc8] transition-colors" />
            <item.icon className="w-5 h-5 text-[#00ffc8]" />
            <div className="flex-1">
              <span className="text-sm text-gray-300 block">{item.name}</span>
              <span className="text-xs text-gray-500">{item.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
