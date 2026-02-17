import { createClient } from '@/lib/supabase/server'
import { BuilderCanvas } from '@/components/builder/canvas/BuilderCanvas'
import { notFound } from 'next/navigation'

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !template) {
    notFound()
  }

  return <BuilderCanvas template={template} />
}
