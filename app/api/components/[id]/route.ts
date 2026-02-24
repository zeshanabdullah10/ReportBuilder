import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/components/[id] - Get a specific custom component
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: component, error } = await supabase
      .from('custom_components')
      .select('*')
      .eq('id', id)
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Component not found' }, { status: 404 })
      }
      console.error('Error fetching custom component:', error)
      return NextResponse.json({ error: 'Failed to fetch component' }, { status: 500 })
    }

    return NextResponse.json({ component })
  } catch (error) {
    console.error('Unexpected error in GET /api/components/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/components/[id] - Update a custom component
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if component exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('custom_components')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 })
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, config, thumbnail_url, is_public } = body

    // Build update object
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (category !== undefined) updates.category = category
    if (config !== undefined) updates.config = config
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url
    if (is_public !== undefined) updates.is_public = is_public

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: component, error } = await supabase
      .from('custom_components')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating custom component:', error)
      return NextResponse.json({ error: 'Failed to update component' }, { status: 500 })
    }

    return NextResponse.json({ component })
  } catch (error) {
    console.error('Unexpected error in PUT /api/components/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/components/[id] - Delete a custom component
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if component exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('custom_components')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 })
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('custom_components')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting custom component:', error)
      return NextResponse.json({ error: 'Failed to delete component' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/components/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
