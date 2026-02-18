'use client'

import { useNode } from '@craftjs/core'
import { PageSettings } from '../settings/PageSettings'

interface PageProps {
  background?: string
  padding?: number
  children?: React.ReactNode
}

export const Page = ({ background = 'transparent', padding = 40, children }: PageProps) => {
  const {
    connectors: { connect },
    selected,
    hovered,
  } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }))

  return (
    <div
      ref={(ref) => {
        if (ref) connect(ref)
      }}
      style={{
        position: 'relative',
        background,
        padding: `${padding}px`,
        minHeight: '100%',
        width: '100%',
        outline: selected ? '2px solid #00ffc8' : hovered ? '1px dashed rgba(0,255,200,0.5)' : 'none',
        outlineOffset: '-2px',
      }}
      className="transition-all duration-200 min-h-[600px]"
    >
      {!children && (
        <div className="flex items-center justify-center h-full min-h-[500px] text-gray-400 border-2 border-dashed border-gray-600 rounded-lg m-4">
          <p className="text-center p-8">
            <span className="block text-3xl mb-3 text-[#00ffc8]/50">+</span>
            Drag components here to build your template
          </p>
        </div>
      )}
      {children}
    </div>
  )
}

Page.craft = {
  displayName: 'Page',
  props: {
    background: 'transparent',
    padding: 20,
  },
  rules: {
    canMoveIn: () => true,
    canDrag: () => false, // Prevent dragging/deleting the root canvas
  },
  related: {
    settings: PageSettings,
  },
}
