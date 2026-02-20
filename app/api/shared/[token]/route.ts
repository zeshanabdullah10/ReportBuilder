/**
 * Shared Template Access API Route
 *
 * GET /api/shared/[token] - Access a shared template via token
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  // Find the share by token
  const { data: share, error: shareError } = await supabase
    .from('template_shares')
    .select('*, templates!template_shares_template_id_fkey(*)')
    .eq('share_token', token)
    .eq('share_type', 'link')
    .single()

  if (shareError || !share) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }

  // Check if share has expired
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
  }

  // Update last accessed timestamp
  await supabase
    .from('template_shares')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', share.id)

  // Return the template data
  const template = share.templates as any

  return NextResponse.json({
    share: {
      id: share.id,
      permission: share.permission,
      hasPassword: !!share.password_hash,
    },
    template: {
      id: template.id,
      name: template.name,
      description: template.description,
      canvas_state: template.canvas_state,
      sample_data: template.sample_data,
    },
  })
}

// POST - Verify password for password-protected shares
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const body = await request.json()
  const { password } = body

  // Find the share by token
  const { data: share, error: shareError } = await supabase
    .from('template_shares')
    .select('*, templates!template_shares_template_id_fkey(*)')
    .eq('share_token', token)
    .eq('share_type', 'link')
    .single()

  if (shareError || !share) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }

  // Check if share has expired
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
  }

  // Verify password
  if (share.password_hash && share.password_hash !== password) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // Update last accessed timestamp
  await supabase
    .from('template_shares')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', share.id)

  // Return the template data
  const template = share.templates as any

  return NextResponse.json({
    share: {
      id: share.id,
      permission: share.permission,
    },
    template: {
      id: template.id,
      name: template.name,
      description: template.description,
      canvas_state: template.canvas_state,
      sample_data: template.sample_data,
    },
  })
}
