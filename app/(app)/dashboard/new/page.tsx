import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function NewTemplatePage() {
  const supabase = await createClient()

  // Create a new empty template and redirect to builder
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: template, error } = await supabase
    .from('templates')
    .insert({
      user_id: user.id,
      name: 'Untitled Template',
      canvas_state: {},
      sample_data: {
        meta: {
          reportTitle: 'Sample Report',
          testDate: new Date().toISOString(),
          testId: 'TEST-001',
          operator: 'Operator Name',
        },
        results: {
          overallStatus: 'PASS',
          tests: [],
        },
        charts: {},
      },
      settings: {
        pageSize: 'A4',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
      },
    })
    .select('id')
    .single()

  if (error || !template) {
    throw new Error('Failed to create template')
  }

  redirect(`/builder/${template.id}`)
}
