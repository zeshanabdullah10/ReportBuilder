'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'

export function ContainerSettings() {
  const {
    actions: { setProp },
    background,
    padding,
    borderRadius,
    borderWidth,
    borderColor,
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
    borderRadius: node.data.props.borderRadius,
    borderWidth: node.data.props.borderWidth,
    borderColor: node.data.props.borderColor,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Background</label>
        <Input
          type="color"
          value={background === 'transparent' ? '#ffffff' : background}
          onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Padding</label>
          <Input
            type="number"
            value={padding}
            onChange={(e) => setProp((props: any) => (props.padding = parseInt(e.target.value) || 0))}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Border Radius</label>
          <Input
            type="number"
            value={borderRadius}
            onChange={(e) => setProp((props: any) => (props.borderRadius = parseInt(e.target.value) || 0))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Border Width</label>
          <Input
            type="number"
            value={borderWidth}
            onChange={(e) => setProp((props: any) => (props.borderWidth = parseInt(e.target.value) || 0))}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Border Color</label>
          <Input
            type="color"
            value={borderColor}
            onChange={(e) => setProp((props: any) => (props.borderColor = e.target.value))}
          />
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
