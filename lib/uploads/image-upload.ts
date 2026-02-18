import { createClient } from '@/lib/supabase/client'
import { IMAGE_UPLOAD_CONFIG, STORAGE_BUCKET_NAME } from '@/lib/constants/uploads'

export interface UploadResult {
  path: string
  publicUrl: string
  error?: never
}

export interface UploadError {
  error: string
  path?: never
  publicUrl?: never
}

type UploadResponse = UploadResult | UploadError

/**
 * Validates a file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > IMAGE_UPLOAD_CONFIG.maxFileSize) {
    const maxSizeMB = IMAGE_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` }
  }

  if (!IMAGE_UPLOAD_CONFIG.allowedMimeTypes.includes(file.type as any)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${IMAGE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Generates a unique file path for storage
 */
function generateFilePath(templateId: string, fileName: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const extension = fileName.split('.').pop() || 'jpg'
  return `${templateId}/${timestamp}_${randomId}.${extension}`
}

/**
 * Uploads an image to Supabase Storage
 */
export async function uploadTemplateImage(
  file: File,
  templateId: string
): Promise<UploadResponse> {
  // Validate file first
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { error: validation.error! }
  }

  try {
    const supabase = createClient()
    const filePath = generateFilePath(templateId, file.name)

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: uploadError.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(filePath)

    return {
      path: filePath,
      publicUrl: urlData.publicUrl,
    }
  } catch (err) {
    console.error('Upload exception:', err)
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteTemplateImage(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .remove([filePath])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Delete exception:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Delete failed' }
  }
}
