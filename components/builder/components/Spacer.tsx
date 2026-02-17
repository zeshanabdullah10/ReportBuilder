'use client'

import { useNode } from '@craftjs/core'
import { SpacerSettings } from '../settings/SpacerSettings'

interface SpacerProps {
  height?: number
}

export const Spacer = ({ height = 40 }: SpacerProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{ height: `${height}px` }}
      className="w-full cursor-pointer border border-dashed border-gray-300 hover:border-[#00ffc8] flex items-center justify-center group"
    >
      <span className="text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        Spacer ({height}px)
      </span>
    </div>
  )
}

Spacer.craft = {
  displayName: 'Spacer',
  props: {
    height: 40,
  },
  related: {
    settings: SpacerSettings,
  },
}
