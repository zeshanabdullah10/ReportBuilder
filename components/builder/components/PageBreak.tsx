'use client'

import { useNode } from '@craftjs/core'

export const PageBreak = () => {
  const {
    connectors: { connect },
  } = useNode()

  return (
    <div
      ref={(ref) => {
        if (ref) connect(ref)
      }}
      className="w-full cursor-pointer flex items-center gap-4 py-4"
    >
      <div className="flex-1 border-t-2 border-dashed border-gray-400" />
      <span className="text-gray-500 text-xs font-medium px-3 py-1 bg-gray-100 rounded">
        PAGE BREAK
      </span>
      <div className="flex-1 border-t-2 border-dashed border-gray-400" />
    </div>
  )
}

PageBreak.craft = {
  displayName: 'Page Break',
  props: {},
}
