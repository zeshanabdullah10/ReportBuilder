'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'

export function ImageSettings() {
  const {
    actions: { setProp },
    src,
    alt,
  } = useNode((node) => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Image URL</label>
        <Input
          value={src}
          onChange={(e) => setProp((props: any) => (props.src = e.target.value))}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Alt Text</label>
        <Input
          value={alt}
          onChange={(e) => setProp((props: any) => (props.alt = e.target.value))}
        />
      </div>
    </div>
  )
}
