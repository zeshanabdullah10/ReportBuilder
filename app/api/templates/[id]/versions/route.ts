/**
 * Template Versions API Route
 *
 * GET /api/templates/[id]/versions - List all versions for a template
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    .select('id, user_id, name')
    .eq('id', id)
    .single()

  if (templateError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  if (template.user_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Get all versions for this template
  const { data: versions, error: versionsError } = await supabase
    .from('template_versions')
    .select('id, version_number, change_description, created_by, created_at')
    .eq('template_id', id)
    .order('version_number', { ascending: false })

  if (versionsError) {
    return NextResponse.json({ error: versionsError.message }, { status: 500 })
  }

  return NextResponse.json({
    template: {
      id: template.id,
      name: template.name,
    },
    versions: versions || [],
  })
}
