/**
 * Template Version API Route
 *
 * GET /api/templates/[id]/versions/[version] - Get a specific version
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
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

  // Get the specific version
  const { data: versionData, error: versionError } = await supabase
    .from('template_versions')
    .select('*')
    .eq('template_id', id)
    .eq('version_number', versionNumber)
    .single()

  if (versionError || !versionData) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }

  return NextResponse.json(versionData)
}
