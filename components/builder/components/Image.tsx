'use client'

import { useNode } from '@craftjs/core'
import { ImageSettings } from '../settings/ImageSettings'
import { ResizableBox } from '../layout/ResizableBox'

interface ImageProps {
  src?: string
  alt?: string
  width?: string
  height?: string
  objectFit?: 'cover' | 'contain' | 'fill'
  x?: number
  y?: number
}

export const Image = ({
  src = 'https://via.placeholder.com/300x200',
  alt = 'Image',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  x = 0,
  y = 0,
}: ImageProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  // Use fixed dimensions for ResizableBox (component-level width/height are internal image dimensions)
  const boxWidth = 300
  const boxHeight = 200

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: ImageProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      // Note: width/height in props control internal image sizing, not box size
    })
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={boxWidth}
      height={boxHeight}
      minWidth={50}
      minHeight={50}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
    >
      <div
        ref={(ref) => {
          if (ref) connect(ref)
        }}
        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            display: 'block',
          }}
        />
      </div>
    </ResizableBox>
  )
}

Image.craft = {
  displayName: 'Image',
  props: {
    src: 'https://via.placeholder.com/300x200',
    alt: 'Image',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
    x: 0,
    y: 0,
    boxWidth: 300,
    boxHeight: 200,
  },
  related: {
    settings: ImageSettings,
  },
}
