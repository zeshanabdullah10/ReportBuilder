'use client'

import { useNode } from '@craftjs/core'
import { BulletListSettings } from '../settings/BulletListSettings'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface BulletListProps {
  items?: string
  listStyle?: 'disc' | 'circle' | 'square' | 'decimal' | 'lower-roman' | 'upper-alpha'
  fontSize?: number
  fontFamily?: string
  color?: string
  lineHeight?: number
  binding?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

export const BulletList = ({
  items = 'Item 1\nItem 2\nItem 3',
  listStyle = 'disc',
  fontSize = 14,
  fontFamily = 'inherit',
  color = '#ffffff',
  lineHeight = 1.6,
  binding = '',
  x = 0,
  y = 0,
  width = 200,
  height = 100,
}: BulletListProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  const { isPreviewMode, sampleData } = useBuilderStore()

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: BulletListProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  // Get list items
  const getListItems = (): string[] => {
    if (isPreviewMode && sampleData && binding && hasBindings(binding)) {
      const resolved = resolveBindingOrValue(binding, sampleData)
      if (Array.isArray(resolved)) {
        return resolved.map((item: any) => {
          if (typeof item === 'string') return item
          if (typeof item === 'object' && item !== null) {
            return item.label || item.name || item.text || String(item)
          }
          return String(item)
        })
      }
    }
    return items.split('\n').filter((item) => item.trim())
  }

  const listItems = getListItems()
  const isOrdered = ['decimal', 'lower-roman', 'upper-alpha'].includes(listStyle)

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={100}
      minHeight={50}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          outline: selected ? '2px solid #00ffc8' : '1px dashed transparent',
          outlineOffset: '2px',
          borderRadius: '4px',
          padding: '8px 12px',
        }}
      >
        {isOrdered ? (
          <ol
            style={{
              listStyleType: listStyle,
              margin: 0,
              paddingLeft: '1.5em',
              fontSize: `${fontSize}px`,
              fontFamily,
              color,
              lineHeight,
            }}
          >
            {listItems.map((item, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {item}
              </li>
            ))}
          </ol>
        ) : (
          <ul
            style={{
              listStyleType: listStyle,
              margin: 0,
              paddingLeft: '1.5em',
              fontSize: `${fontSize}px`,
              fontFamily,
              color,
              lineHeight,
            }}
          >
            {listItems.map((item, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ResizableBox>
  )
}

BulletList.craft = {
  displayName: 'List',
  props: {
    items: 'Item 1\nItem 2\nItem 3',
    listStyle: 'disc',
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#333333',
    lineHeight: 1.6,
    binding: '',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
  },
  related: {
    settings: BulletListSettings,
  },
}
