'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'

export function SpacerSettings() {
  const {
    actions: { setProp },
    height,
  } = useNode((node) => ({
    height: node.data.props.height,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Height (px)</label>
        <Input
          type="number"
          value={height}
          onChange={(e) => setProp((props: any) => (props.height = parseInt(e.target.value) || 40))}
        />
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
