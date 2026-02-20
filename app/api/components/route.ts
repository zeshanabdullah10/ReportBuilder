import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/components - List custom components
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const componentType = searchParams.get('type')
    const category = searchParams.get('category')
    const includePublic = searchParams.get('public') === 'true'

    let query = supabase
      .from('custom_components')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })

    // Filter by user's components or public components
    if (includePublic) {
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`)
    } else {
      query = query.eq('user_id', user.id)
    }

    // Filter by component type if provided
    if (componentType) {
      query = query.eq('component_type', componentType)
    }

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    const { data: components, error } = await query

    if (error) {
      console.error('Error fetching custom components:', error)
      return NextResponse.json({ error: 'Failed to fetch components' }, { status: 500 })
    }

    return NextResponse.json({ components })
  } catch (error) {
    console.error('Unexpected error in GET /api/components:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/components - Create a new custom component
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, component_type, config, thumbnail_url, is_public } = body

    // Validate required fields
    if (!name || !component_type || !config) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, component_type, and config are required' 
      }, { status: 400 })
    }

    // Validate component type
    const validTypes = ['Text', 'Container', 'Image', 'Table', 'Chart', 'Spacer', 
                       'PageBreak', 'Indicator', 'Divider', 'PageNumber', 
                       'DateTime', 'Gauge', 'ProgressBar', 'BulletList']
    
    if (!validTypes.includes(component_type)) {
      return NextResponse.json({ 
        error: `Invalid component_type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Create the component
    const { data: component, error } = await supabase
      .from('custom_components')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        category: category || 'custom',
        component_type,
        config,
        thumbnail_url: thumbnail_url || null,
        is_public: is_public || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating custom component:', error)
      return NextResponse.json({ error: 'Failed to create component' }, { status: 500 })
    }

    return NextResponse.json({ component }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/components:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
