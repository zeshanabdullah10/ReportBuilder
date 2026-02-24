'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'
import { ImageUploader } from './ImageUploader'
import { useBuilderStore } from '@/lib/stores/builder-store'

export function ImageSettings() {
  const {
    actions: { setProp },
    src,
    alt,
  } = useNode((node) => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
  }))

  const templateId = useBuilderStore((state) => state.templateId)

  const handleImageUploaded = (url: string) => {
    setProp((props: any) => (props.src = url))
  }

  return (
    <div className="space-y-4">
      {/* Image Upload Section */}
      {templateId && (
        <>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Upload Image</label>
            <ImageUploader
              templateId={templateId}
              onImageUploaded={handleImageUploaded}
              currentImageUrl={src}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[rgba(0,255,200,0.1)]" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-[rgba(0,255,200,0.1)]" />
          </div>
        </>
      )}

      {/* URL Input */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Image URL</label>
        <Input
          value={src}
          onChange={(e) => setProp((props: any) => (props.src = e.target.value))}
          placeholder="https://..."
        />
      </div>

      {/* Alt Text */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Alt Text</label>
        <Input
          value={alt}
          onChange={(e) => setProp((props: any) => (props.alt = e.target.value))}
        />
      </div>

      {/* Position Settings */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
