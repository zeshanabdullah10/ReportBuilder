/**
 * Template Export API Route
 *
 * GET /api/templates/[id]/export - Download template as HTML (uses query params for options)
 * POST /api/templates/[id]/export - Export with body options (for programmatic use)
 *
 * Compiles a template into a standalone HTML file for offline use with LabVIEW.
 * Supports both single-page and multi-page templates.
 * 
 * Open Source - All exports are clean (no watermarks).
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { compileTemplate, compileMultiPageTemplate, ExportOptions, CanvasState, PageState } from '@/lib/export'

export async function GET(
  request: NextRequest,
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

  // 3. Parse export options from query params
  const { searchParams } = new URL(request.url)
  const includeSampleData = searchParams.get('includeSampleData') === 'true'
  const filename = searchParams.get('filename') || template.name || 'Report'

  const options: ExportOptions = {
    filename,
    includeSampleData,
    pageSize: 'A4',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    includeWatermark: false, // Always clean exports for open source
  }

  // 4. Compile and return
  try {
    const sampleData = options.includeSampleData
      ? (template.sample_data as Record<string, unknown> | null)
      : null

    const templateSettings = template.settings as Record<string, unknown> | null
    const templatePages = templateSettings?.pages as PageState[] | null
    
    if (templatePages && Array.isArray(templatePages) && templatePages.length > 0) {
      const validPages = templatePages.filter(page =>
        page.canvasState &&
        typeof page.canvasState === 'object' &&
        Object.keys(page.canvasState).length > 0
      )
      
      if (validPages.length === 0) {
        return NextResponse.json({ error: 'No valid pages found in template' }, { status: 400 })
      }
      
      const html = await compileMultiPageTemplate(validPages, sampleData, options)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(options.filename)}.html"`,
        },
      })
    } else {
      const canvasState = template.canvas_state as unknown as CanvasState
      
      if (!canvasState || typeof canvasState !== 'object' || Object.keys(canvasState).length === 0) {
        return NextResponse.json({ error: 'Template has no content to export' }, { status: 400 })
      }
      
      const html = await compileTemplate(canvasState, sampleData, options)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(options.filename)}.html"`,
        },
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to compile template' }, { status: 500 })
  }
}

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
    includeWatermark: false, // Always clean exports for open source
  }

  // 4. Compile template
  try {
    const sampleData = options.includeSampleData
      ? (template.sample_data as Record<string, unknown> | null)
      : null

    const templateSettings = template.settings as Record<string, unknown> | null
    const templatePages = templateSettings?.pages as PageState[] | null
    
    if (templatePages && Array.isArray(templatePages) && templatePages.length > 0) {
      const validPages = templatePages.filter(page => 
        page.canvasState && 
        typeof page.canvasState === 'object' &&
        Object.keys(page.canvasState).length > 0
      )
      
      if (validPages.length === 0) {
        return NextResponse.json(
          { error: 'No valid pages found in template' },
          { status: 400 }
        )
      }
      
      const html = await compileMultiPageTemplate(validPages, sampleData, options)
      
      const filename = `${options.filename}.html`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      })
    } else {
      const canvasState = template.canvas_state as unknown as CanvasState
      
      if (!canvasState || typeof canvasState !== 'object' || Object.keys(canvasState).length === 0) {
        return NextResponse.json(
          { error: 'Template has no content to export' },
          { status: 400 }
        )
      }
      
      const html = await compileTemplate(canvasState, sampleData, options)
      
      const filename = `${options.filename}.html`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to compile template' },
      { status: 500 }
    )
  }
}
