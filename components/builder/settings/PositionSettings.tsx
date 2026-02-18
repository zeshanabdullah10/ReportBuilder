'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'

export function PositionSettings() {
  const {
    actions: { setProp },
    x,
    y,
    width,
    height,
  } = useNode((node) => ({
    x: node.data.props.x,
    y: node.data.props.y,
    width: node.data.props.width,
    height: node.data.props.height,
  }))

  return (
    <div className="space-y-3">
      <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
        Position & Size
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">X</label>
          <Input
            type="number"
            value={x ?? 0}
            onChange={(e) => setProp((props: any) => (props.x = parseInt(e.target.value) || 0))}
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Y</label>
          <Input
            type="number"
            value={y ?? 0}
            onChange={(e) => setProp((props: any) => (props.y = parseInt(e.target.value) || 0))}
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Width</label>
          <Input
            type="number"
            value={width ?? 100}
            onChange={(e) => setProp((props: any) => (props.width = parseInt(e.target.value) || 100))}
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Height</label>
          <Input
            type="number"
            value={height ?? 50}
            onChange={(e) => setProp((props: any) => (props.height = parseInt(e.target.value) || 50))}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  )
}
