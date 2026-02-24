/**
 * Template Version Restore API Route
 *
 * POST /api/templates/[id]/versions/[version]/restore - Restore to a specific version
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const { id, version } = await params
  const supabase = await createClient()

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify template ownership
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (templateError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  if (template.user_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Parse version number
  const versionNumber = parseInt(version, 10)
  if (isNaN(versionNumber)) {
    return NextResponse.json({ error: 'Invalid version number' }, { status: 400 })
  }

  // Get the specific version to restore
  const { data: versionData, error: versionError } = await supabase
    .from('template_versions')
    .select('*')
    .eq('template_id', id)
    .eq('version_number', versionNumber)
    .single()

  if (versionError || !versionData) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }

  // Restore the template to this version's state
  // Note: This will trigger the version trigger and create a new version
  const { error: updateError } = await supabase
    .from('templates')
    .update({
      canvas_state: versionData.canvas_state,
      sample_data: versionData.sample_data,
      settings: versionData.settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `Restored to version ${versionNumber}`,
    restoredFrom: {
      version_number: versionData.version_number,
      created_at: versionData.created_at,
    },
  })
}
