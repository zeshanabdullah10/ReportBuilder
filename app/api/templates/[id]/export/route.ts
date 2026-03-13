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
import { exportRateLimiter, RateLimitResult } from '@/lib/security/rate-limit'
import { validateCanvasState, ValidatedCanvasState } from '@/lib/validations/canvas-state'

/**
 * Sanitize filename to prevent path traversal attacks
 * - Removes path separators and special characters
 * - Limits length to reasonable size
 */
function sanitizeFilename(name: string | null | undefined): string {
  if (!name) return 'Report'

  // Remove any path components (prevent path traversal)
  let sanitized = name.split(/[/\\]/).pop() || 'Report'

  // Remove or replace dangerous characters
  // Keep only alphanumeric, underscore, hyphen, space, and dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-. ]/g, '_')

  // Remove leading/trailing spaces and dots
  sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '')

  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200)
  }

  // Ensure we have a valid filename
  return sanitized || 'Report'
}

/**
 * Generate rate limit key for a user
 */
function getRateLimitKey(user: { id: string }): string {
  return `export:${user.id}`
}

/**
 * Create rate limit headers from a rate limit result
 */
function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.limit - result.current)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)), // Unix timestamp in seconds
  }
}

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

  // 2. Check rate limit
  const rateLimitResult = exportRateLimiter.check(getRateLimitKey(user))
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many export requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)),
          ...createRateLimitHeaders(rateLimitResult),
        },
      }
    )
  }

  // 3. Get template and verify ownership
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

  // 4. Parse export options from query params
  const { searchParams } = new URL(request.url)
  const includeSampleData = searchParams.get('includeSampleData') === 'true'
  const filename = sanitizeFilename(searchParams.get('filename') || template.name)

  const options: ExportOptions = {
    filename,
    includeSampleData,
    pageSize: 'A4',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    includeWatermark: false, // Always clean exports for open source
  }

  // 5. Validate canvas state(s)
  const templateSettings = template.settings as Record<string, unknown> | null
  const templatePages = templateSettings?.pages as PageState[] | null
  let validatedCanvasStates: ValidatedCanvasState[] = []

  if (templatePages && Array.isArray(templatePages) && templatePages.length > 0) {
    // Multi-page template: validate each page's canvas state
    for (const page of templatePages) {
      if (!page.canvasState || typeof page.canvasState !== 'object' || Object.keys(page.canvasState).length === 0) {
        continue // Skip empty pages
      }

      const validationResult = validateCanvasState(page.canvasState)
      if (!validationResult.success) {
        return NextResponse.json(
          { error: `Invalid canvas state for page "${page.name}": ${validationResult.error}` },
          { status: 400 }
        )
      }

      validatedCanvasStates.push(validationResult.data!)
    }

    if (validatedCanvasStates.length === 0) {
      return NextResponse.json({ error: 'No valid pages found in template' }, { status: 400 })
    }
  } else {
    // Single-page template: validate the template's canvas_state
    const canvasState = template.canvas_state as unknown as CanvasState

    if (!canvasState || typeof canvasState !== 'object' || Object.keys(canvasState).length === 0) {
      return NextResponse.json({ error: 'Template has no content to export' }, { status: 400 })
    }

    const validationResult = validateCanvasState(canvasState)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: `Invalid canvas state: ${validationResult.error}` },
        { status: 400 }
      )
    }

    validatedCanvasStates = [validationResult.data!]
  }

  // 6. Compile and return using validated canvas states
  try {
    const sampleData = options.includeSampleData
      ? (template.sample_data as Record<string, unknown> | null)
      : null

    if (validatedCanvasStates.length > 1) {
      // Multi-page: compile with validated pages
      const validatedPages: PageState[] = templatePages!
        .filter(page =>
          page.canvasState &&
          typeof page.canvasState === 'object' &&
          Object.keys(page.canvasState).length > 0
        )
        .map((page, index) => ({
          ...page,
          canvasState: validatedCanvasStates[index] as unknown as CanvasState,
        }))

      const html = await compileMultiPageTemplate(validatedPages, sampleData, options)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(options.filename)}.html"`,
          ...createRateLimitHeaders(rateLimitResult),
        },
      })
    } else {
      // Single-page: compile with validated canvas state
      const html = await compileTemplate(validatedCanvasStates[0] as unknown as CanvasState, sampleData, options)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(options.filename)}.html"`,
          ...createRateLimitHeaders(rateLimitResult),
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

  // 2. Check rate limit
  const rateLimitResult = exportRateLimiter.check(getRateLimitKey(user))
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many export requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)),
          ...createRateLimitHeaders(rateLimitResult),
        },
      }
    )
  }

  // 3. Get template and verify ownership
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

  // 4. Parse export options from request body
  const body = await request.json()

  const options: ExportOptions = {
    filename: sanitizeFilename(body.filename || template.name),
    includeSampleData: body.includeSampleData ?? false,
    pageSize: body.pageSize || 'A4',
    margins: body.margins || { top: 20, right: 20, bottom: 20, left: 20 },
    includeWatermark: false, // Always clean exports for open source
  }

  // 5. Validate canvas state(s)
  const templateSettings = template.settings as Record<string, unknown> | null
  const templatePages = templateSettings?.pages as PageState[] | null
  let validatedCanvasStates: ValidatedCanvasState[] = []

  if (templatePages && Array.isArray(templatePages) && templatePages.length > 0) {
    // Multi-page template: validate each page's canvas state
    for (const page of templatePages) {
      if (!page.canvasState || typeof page.canvasState !== 'object' || Object.keys(page.canvasState).length === 0) {
        continue // Skip empty pages
      }

      const validationResult = validateCanvasState(page.canvasState)
      if (!validationResult.success) {
        return NextResponse.json(
          { error: `Invalid canvas state for page "${page.name}": ${validationResult.error}` },
          { status: 400 }
        )
      }

      validatedCanvasStates.push(validationResult.data!)
    }

    if (validatedCanvasStates.length === 0) {
      return NextResponse.json(
        { error: 'No valid pages found in template' },
        { status: 400 }
      )
    }
  } else {
    // Single-page template: validate the template's canvas_state
    const canvasState = template.canvas_state as unknown as CanvasState

    if (!canvasState || typeof canvasState !== 'object' || Object.keys(canvasState).length === 0) {
      return NextResponse.json(
        { error: 'Template has no content to export' },
        { status: 400 }
      )
    }

    const validationResult = validateCanvasState(canvasState)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: `Invalid canvas state: ${validationResult.error}` },
        { status: 400 }
      )
    }

    validatedCanvasStates = [validationResult.data!]
  }

  // 6. Compile template using validated canvas states
  try {
    const sampleData = options.includeSampleData
      ? (template.sample_data as Record<string, unknown> | null)
      : null

    if (validatedCanvasStates.length > 1) {
      // Multi-page: compile with validated pages
      const validatedPages: PageState[] = templatePages!
        .filter(page =>
          page.canvasState &&
          typeof page.canvasState === 'object' &&
          Object.keys(page.canvasState).length > 0
        )
        .map((page, index) => ({
          ...page,
          canvasState: validatedCanvasStates[index] as unknown as CanvasState,
        }))

      const html = await compileMultiPageTemplate(validatedPages, sampleData, options)

      const filename = `${options.filename}.html`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          ...createRateLimitHeaders(rateLimitResult),
        },
      })
    } else {
      // Single-page: compile with validated canvas state
      const html = await compileTemplate(validatedCanvasStates[0] as unknown as CanvasState, sampleData, options)

      const filename = `${options.filename}.html`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          ...createRateLimitHeaders(rateLimitResult),
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
