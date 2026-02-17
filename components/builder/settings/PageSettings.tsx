'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'

export function PageSettings() {
  const {
    actions: { setProp },
    background,
    padding,
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Background Color</label>
        <Input
          type="color"
          value={background}
          onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Padding</label>
        <Input
          type="number"
          value={padding}
          onChange={(e) => setProp((props: any) => (props.padding = parseInt(e.target.value) || 40))}
        />
      </div>
    </div>
  )
}
