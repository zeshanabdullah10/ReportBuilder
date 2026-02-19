/**
 * Template Export API Route
 *
 * POST /api/templates/[id]/export
 * Compiles a template into a standalone HTML file for offline use with LabVIEW.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { compileTemplate, ExportOptions, CanvasState } from '@/lib/export'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get template and verify ownership
  const { data: template, error: fetchError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  if (template.user_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // 3. Parse export options from request body
  const body = await request.json()
  const options: ExportOptions = {
    filename: body.filename || template.name || 'Report',
    includeSampleData: body.includeSampleData ?? false,
    pageSize: body.pageSize || 'A4',
    margins: body.margins || { top: 20, right: 20, bottom: 20, left: 20 },
    includeWatermark: false, // TODO: Check subscription status
  }

  // 4. Compile template
  try {
    const canvasState = template.canvas_state as unknown as CanvasState
    const sampleData = template.sample_data as Record<string, unknown> | null

    const html = await compileTemplate(canvasState, sampleData, options)

    // 5. Return HTML file with download headers
    const filename = `${options.filename}.html`
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to compile template' },
      { status: 500 }
    )
  }
}
