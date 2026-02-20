import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/components/[id]/usage - Increment usage count
export async function POST(
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

    // Call the increment function
    const { error } = await supabase.rpc('increment_component_usage', {
      component_id: id,
    })

    if (error) {
      console.error('Error incrementing usage count:', error)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in POST /api/components/[id]/usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
