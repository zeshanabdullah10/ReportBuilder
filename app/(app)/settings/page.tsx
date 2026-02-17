import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <Input
                  name="fullName"
                  defaultValue={profile?.full_name ?? ''}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company
                </label>
                <Input
                  name="company"
                  defaultValue={profile?.company ?? ''}
                  placeholder="Your company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  defaultValue={user?.email ?? ''}
                  disabled
                />
                <p className="mt-1 text-xs text-slate-500">
                  Email cannot be changed
                </p>
              </div>
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Free Plan</p>
                <p className="text-sm text-slate-600">1 template, watermarked PDFs</p>
              </div>
              <Button variant="outline">Upgrade to Pro</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
