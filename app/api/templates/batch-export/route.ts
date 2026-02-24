/**
 * Batch Export API Route
 *
 * POST /api/templates/batch-export - Export multiple templates with a single data set
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { compileTemplate, ExportOptions, CanvasState } from '@/lib/export'
import JSZip from 'jszip'

interface BatchExportRequest {
  templateIds: string[]
  data: Record<string, unknown>
  options: {
    filename?: string
    pageSize?: 'A4' | 'Letter'
    margins?: { top: number; right: number; bottom: number; left: number }
    includeWatermark?: boolean
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse request body
  let body: BatchExportRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { templateIds, data, options } = body

  // Validate template IDs
  if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
    return NextResponse.json({ error: 'Template IDs are required' }, { status: 400 })
  }

  if (templateIds.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 templates can be exported at once' }, { status: 400 })
  }

  // Fetch all templates
  const { data: templates, error: fetchError } = await supabase
    .from('templates')
    .select('*')
    .in('id', templateIds)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!templates || templates.length === 0) {
    return NextResponse.json({ error: 'No templates found' }, { status: 404 })
  }

  // Verify ownership of all templates
  const ownedTemplateIds = templates.filter(t => t.user_id === user.id).map(t => t.id)
  const unauthorizedIds = templateIds.filter(id => !ownedTemplateIds.includes(id))
  
  if (unauthorizedIds.length > 0) {
    return NextResponse.json({ 
      error: `Access denied for templates: ${unauthorizedIds.join(', ')}` 
    }, { status: 403 })
  }

  // Check credits for clean exports
  const includeWatermark = options?.includeWatermark ?? true
  if (!includeWatermark) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 })
    }

    const requiredCredits = templates.length
    if (!profile.credits || profile.credits < requiredCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${requiredCredits} credits for ${templates.length} clean exports.` },
        { status: 402 }
      )
    }

    // Deduct credits
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - requiredCredits })
      .eq('id', user.id)

    if (deductError) {
      return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
    }
  }

  // Export options
  const exportOptions: ExportOptions = {
    filename: options?.filename || 'Report',
    includeSampleData: false,
    pageSize: options?.pageSize || 'A4',
    margins: options?.margins || { top: 20, right: 20, bottom: 20, left: 20 },
    includeWatermark,
  }

  // Process each template
  const results: {
    success: { templateId: string; templateName: string; filename: string }[]
    errors: { templateId: string; error: string }[]
  } = { success: [], errors: [] }

  const zip = new JSZip()

  for (const template of templates) {
    try {
      const canvasState = template.canvas_state as unknown as CanvasState
      
      const html = await compileTemplate(canvasState, data, {
        ...exportOptions,
        filename: template.name,
      })

      // Sanitize filename
      const sanitizedName = template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const filename = `${sanitizedName}.html`

      zip.file(filename, html)
      
      results.success.push({
        templateId: template.id,
        templateName: template.name,
        filename,
      })
    } catch (error) {
      results.errors.push({
        templateId: template.id,
        error: error instanceof Error ? error.message : 'Export failed',
      })
    }
  }

  // If only one template and no errors, return the single HTML file
  if (templates.length === 1 && results.errors.length === 0) {
    const singleResult = results.success[0]
    const htmlContent = await zip.file(singleResult.filename)?.async('string')
    
    if (!htmlContent) {
      return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
    }

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(singleResult.filename)}"`,
      },
    })
  }

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const zipBuffer = await zipBlob.arrayBuffer()

  const zipFilename = `${exportOptions.filename}_batch_${Date.now()}.zip`

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(zipFilename)}"`,
    },
  })
}
