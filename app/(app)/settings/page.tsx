import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { Github } from 'lucide-react'

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
      <h1
        className="text-2xl font-bold text-white mb-8"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        Settings
      </h1>

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
            <ProfileForm
              initialFullName={profile?.full_name ?? ''}
              initialCompany={profile?.company ?? ''}
            />
            <div className="mt-6 pt-6 border-t border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <Input
                name="email"
                type="email"
                defaultValue={user?.email ?? ''}
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Open Source Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5 text-[#00ffc8]" />
              Open Source
            </CardTitle>
            <CardDescription>
              This is an open-source project - all features are free to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">
                  All exports are clean (no watermarks). No credits needed.
                </p>
              </div>
              <a
                href="https://github.com/your-repo/report-builder"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-md border border-[#00ffc8] text-[#00ffc8] hover:bg-[#00ffc8]/10 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                Star on GitHub
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
