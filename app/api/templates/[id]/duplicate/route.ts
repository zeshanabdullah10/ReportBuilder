import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/templates/[id]/duplicate
 * Duplicate a template by ID
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the original template
  const { data: original, error: fetchError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !original) {
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    )
  }

  // Create a copy with "(Copy)" suffix
  const copyName = original.name.endsWith(' (Copy)')
    ? `${original.name} (2)`
    : original.name.match(/\(Copy\)\s*\((\d+)\)$/)
      ? original.name.replace(/\(Copy\)\s*\((\d+)\)$/, (_, num) => `(Copy) (${parseInt(num) + 1})`)
      : `${original.name} (Copy)`

  const { data: copy, error: insertError } = await supabase
    .from('templates')
    .insert({
      user_id: user.id,
      name: copyName,
      description: original.description,
      canvas_state: original.canvas_state,
      sample_data: original.sample_data,
      settings: original.settings,
    })
    .select('id, name')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(copy, { status: 201 })
}
