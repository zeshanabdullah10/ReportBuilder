/**
 * Template Shares API Route
 *
 * GET /api/templates/[id]/shares - List all shares for a template
 * POST /api/templates/[id]/shares - Create a new share
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - List all shares for a template
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

  // Get all shares for this template
  const { data: shares, error: sharesError } = await supabase
    .from('template_shares')
    .select('id, share_type, share_token, shared_with_email, permission, expires_at, created_at, last_accessed_at')
    .eq('template_id', id)
    .order('created_at', { ascending: false })

  if (sharesError) {
    return NextResponse.json({ error: sharesError.message }, { status: 500 })
  }

  return NextResponse.json({
    template: {
      id: template.id,
      name: template.name,
    },
    shares: shares || [],
  })
}

// POST - Create a new share
export async function POST(
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

  // Parse request body
  const body = await request.json()
  const {
    share_type,
    shared_with_email,
    permission,
    password,
    expires_at,
  } = body

  // Validate share type
  if (!['link', 'user'].includes(share_type)) {
    return NextResponse.json({ error: 'Invalid share type' }, { status: 400 })
  }

  // For user sharing, email is required
  if (share_type === 'user' && !shared_with_email) {
    return NextResponse.json({ error: 'Email is required for user sharing' }, { status: 400 })
  }

  // Create the share
  const shareData = {
    template_id: id,
    share_type: share_type as 'link' | 'user',
    permission: (permission || 'view') as 'view' | 'edit',
    created_by: user.id,
    shared_with_email: share_type === 'user' ? shared_with_email : null,
    password_hash: password || null,
    expires_at: expires_at || null,
  }

  const { data: share, error: shareError } = await supabase
    .from('template_shares')
    .insert(shareData)
    .select()
    .single()

  if (shareError) {
    return NextResponse.json({ error: shareError.message }, { status: 500 })
  }

  // Update template to mark as shared
  await supabase
    .from('templates')
    .update({ is_shared: true })
    .eq('id', id)

  return NextResponse.json(share)
}

// DELETE - Remove a share
export async function DELETE(
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

  // Get share_id from query params
  const { searchParams } = new URL(request.url)
  const shareId = searchParams.get('share_id')

  if (!shareId) {
    return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
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

  // Delete the share
  const { error: deleteError } = await supabase
    .from('template_shares')
    .delete()
    .eq('id', shareId)
    .eq('template_id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Check if there are any remaining shares
  const { count } = await supabase
    .from('template_shares')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', id)

  // If no more shares, update is_shared flag
  if (count === 0) {
    await supabase
      .from('templates')
      .update({ is_shared: false })
      .eq('id', id)
  }

  return NextResponse.json({ success: true })
}
