import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FilePlus } from 'lucide-react'
import { TemplateGrid } from '@/components/dashboard/TemplateGrid'

// Helper to count components in canvas state
function countComponents(canvasState: unknown): number {
  if (!canvasState || typeof canvasState !== 'object' || Array.isArray(canvasState)) return 0

  const state = canvasState as Record<string, unknown>
  const nodes = state.nodes ||
    (state.STATE as Record<string, unknown> | undefined)?.nodes ||
    canvasState

  if (typeof nodes === 'object' && nodes !== null && !Array.isArray(nodes)) {
    const nodesObj = nodes as Record<string, unknown>
    const nodeIds = Object.keys(nodesObj)
    return nodeIds.filter(id => {
      const node = nodesObj[id]
      return node && typeof node === 'object' && !Array.isArray(node) &&
        (node as Record<string, unknown>).displayName !== 'Page'
    }).length
  }

  return 0
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch templates with canvas_state for component counting
  const { data: templates } = await supabase
    .from('templates')
    .select('id, name, description, created_at, updated_at, canvas_state')
    .order('updated_at', { ascending: false })

  // Fetch subscription for plan info
  const { data: subscription } = user?.id ? await supabase
    .from('subscriptions')
    .select('plan_type')
    .eq('user_id', user.id)
    .single() : { data: null }

  // Process templates to include component count
  const processedTemplates = templates?.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    created_at: t.created_at,
    updated_at: t.updated_at,
    canvas_state: t.canvas_state as Record<string, unknown> | null,
    componentCount: countComponents(t.canvas_state),
  })) ?? []

  // Calculate stats
  const totalTemplates = processedTemplates.length
  const totalComponents = processedTemplates.reduce((sum, t) => sum + (t.componentCount ?? 0), 0)
  const planType = subscription?.plan_type ?? 'free'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Welcome back! Manage your report templates here.
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button className="gap-2">
            <FilePlus className="h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#00ffc8]" style={{ textShadow: '0 0 20px rgba(0, 255, 200, 0.3)' }}>
              {totalTemplates}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalComponents} total components
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Downloads This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#00ffc8]" style={{ textShadow: '0 0 20px rgba(0, 255, 200, 0.3)' }}>
              0
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Coming soon
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white capitalize">
              {planType}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {planType === 'free' ? 'Upgrade for more features' : 'Active subscription'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      <div>
        <h2
          className="text-lg font-semibold text-white mb-4"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Your Templates
        </h2>

        <TemplateGrid templates={processedTemplates} />
      </div>
    </div>
  )
}
