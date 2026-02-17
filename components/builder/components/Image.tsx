'use client'

import { useNode } from '@craftjs/core'
import { ImageSettings } from '../settings/ImageSettings'

interface ImageProps {
  src?: string
  alt?: string
  width?: string
  height?: string
  objectFit?: 'cover' | 'contain' | 'fill'
}

export const Image = ({
  src = 'https://via.placeholder.com/300x200',
  alt = 'Image',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
}: ImageProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{ width, height, cursor: 'pointer' }}
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
  },
  related: {
    settings: ImageSettings,
  },
}
