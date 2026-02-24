'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type TemplateAsset = Database['public']['Tables']['template_assets']['Row']
type TemplateAssetInsert = Database['public']['Tables']['template_assets']['Insert']

interface SaveAssetParams {
  templateId: string
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
}

interface ActionResult<T = void> {
  data?: T
  error?: string
}

/**
 * Save asset metadata to the database after successful upload
 */
export async function saveAssetMetadata(params: SaveAssetParams): Promise<ActionResult<TemplateAsset>> {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Verify the template belongs to the user
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('user_id')
    .eq('id', params.templateId)
    .single()

  if (templateError || !template) {
    return { error: 'Template not found' }
  }

  if (template.user_id !== user.id) {
    return { error: 'Access denied' }
  }

  // Insert asset record
  const assetData: TemplateAssetInsert = {
    template_id: params.templateId,
    file_path: params.filePath,
    file_name: params.fileName,
    file_size: params.fileSize,
    mime_type: params.mimeType,
  }

  const { data, error } = await supabase
    .from('template_assets')
    .insert(assetData)
    .select()
    .single()

  if (error) {
    console.error('Error saving asset metadata:', error)
    return { error: error.message }
  }

  return { data }
}

/**
 * Delete asset metadata from database
 */
export async function deleteAssetMetadata(assetId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get the asset with template info to verify ownership
  const { data: asset, error: assetError } = await supabase
    .from('template_assets')
    .select('id, file_path, template_id')
    .eq('id', assetId)
    .single()

  if (assetError || !asset) {
    return { error: 'Asset not found' }
  }

  // Verify the template belongs to the user
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('user_id')
    .eq('id', asset.template_id)
    .single()

  if (templateError || !template) {
    return { error: 'Template not found' }
  }

  if (template.user_id !== user.id) {
    return { error: 'Access denied' }
  }

  // Delete from storage first
  const { error: storageError } = await supabase.storage
    .from('template-assets')
    .remove([asset.file_path])

  if (storageError) {
    console.error('Error deleting from storage:', storageError)
    // Continue to delete from database even if storage delete fails
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('template_assets')
    .delete()
    .eq('id', assetId)

  if (deleteError) {
    console.error('Error deleting asset metadata:', deleteError)
    return { error: deleteError.message }
  }

  return {}
}

/**
 * Get all assets for a template
 */
export async function getTemplateAssets(templateId: string): Promise<ActionResult<TemplateAsset[]>> {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Verify the template belongs to the user
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('user_id')
    .eq('id', templateId)
    .single()

  if (templateError || !template) {
    return { error: 'Template not found' }
  }

  if (template.user_id !== user.id) {
    return { error: 'Access denied' }
  }

  // Fetch assets
  const { data, error } = await supabase
    .from('template_assets')
    .select('*')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching assets:', error)
    return { error: error.message }
  }

  return { data: data || [] }
}
