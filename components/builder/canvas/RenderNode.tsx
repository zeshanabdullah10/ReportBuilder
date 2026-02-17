'use client'

import { useNode } from '@craftjs/core'
import { useEffect } from 'react'

export const RenderNode = ({ render }: { render: React.ReactNode }) => {
  const { id, isActive, isHover, dom } = useNode((node) => ({
    isActive: node.events.selected,
    isHover: node.events.hovered,
    dom: node.dom,
  }))

  useEffect(() => {
    if (dom) {
      if (isActive) {
        dom.style.outline = '2px solid #00ffc8'
        dom.style.outlineOffset = '2px'
      } else if (isHover) {
        dom.style.outline = '1px dashed rgba(0,255,200,0.5)'
        dom.style.outlineOffset = '2px'
      } else {
        dom.style.outline = 'none'
      }
    }
  }, [isActive, isHover, dom])

  return <>{render}</>
}
