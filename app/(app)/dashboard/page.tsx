import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FilePlus, FileText, Download } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: templates } = await supabase
    .from('templates')
    .select('id, name, description, created_at, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
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
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {templates?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Downloads This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">Free</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Templates</h2>

        {!templates || templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-600 mb-4">You haven't created any templates yet.</p>
              <Link href="/dashboard/new">
                <Button>Create your first template</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-slate-600">
                    {template.description || 'No description'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Link href={`/builder/${template.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/api/templates/${template.id}/download`}>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
