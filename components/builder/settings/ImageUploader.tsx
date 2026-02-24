'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { uploadTemplateImage, validateImageFile } from '@/lib/uploads/image-upload'
import { saveAssetMetadata } from '@/app/actions/assets'
import { IMAGE_UPLOAD_CONFIG } from '@/lib/constants/uploads'

interface ImageUploaderProps {
  templateId: string
  onImageUploaded: (url: string) => void
  currentImageUrl?: string
}

export function ImageUploader({ templateId, onImageUploaded, currentImageUrl }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset error
    setError(null)

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Start upload
    setIsUploading(true)

    try {
      const result = await uploadTemplateImage(file, templateId)

      if (result.error) {
        setError(result.error)
        setPreview(null)
        return
      }

      // TypeScript narrowing: at this point result is UploadResult (not UploadError)
      // because we returned early if result.error exists
      const successResult = result as { path: string; publicUrl: string }

      // Save asset metadata
      const metadataResult = await saveAssetMetadata({
        templateId,
        filePath: successResult.path,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })

      if (metadataResult.error) {
        console.error('Failed to save asset metadata:', metadataResult.error)
        // Don't show error to user - the image is uploaded and usable
      }

      // Notify parent component
      onImageUploaded(successResult.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreview(null)
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClearPreview = () => {
    setPreview(null)
    setError(null)
  }

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)}MB max`
  }

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_UPLOAD_CONFIG.allowedExtensions.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload area */}
      {!preview ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="w-full h-32 border-2 border-dashed border-[rgba(0,255,200,0.2)] rounded-lg
            bg-[#0a0f14] hover:border-[rgba(0,255,200,0.4)] hover:bg-[rgba(0,255,200,0.05)]
            transition-all duration-200 flex flex-col items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[#00ffc8] animate-spin" />
              <span className="text-sm text-gray-400">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-500" />
              <span className="text-sm text-gray-400">Click to upload image</span>
              <span className="text-xs text-gray-500">
                {IMAGE_UPLOAD_CONFIG.allowedExtensions.join(', ')} • {formatFileSize(IMAGE_UPLOAD_CONFIG.maxFileSize)}
              </span>
            </>
          )}
        </button>
      ) : (
        <div className="relative group">
          <div className="w-full h-32 rounded-lg overflow-hidden bg-[#0a0f14] border border-[rgba(0,255,200,0.2)]">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleClick}
              disabled={isUploading}
              className="p-2 bg-[#00ffc8] text-black rounded-lg hover:bg-[#00ffc8]/80 transition-colors"
              title="Change image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClearPreview}
              disabled={isUploading}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Uploading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#00ffc8] animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
