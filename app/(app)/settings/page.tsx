import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { CreditBalance } from '@/components/billing/credit-balance'
import { Zap, ArrowUpCircle } from 'lucide-react'

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

        {/* Export Credits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#00ffc8]" />
              Export Credits
            </CardTitle>
            <CardDescription>
              Purchase credits for clean (unwatermarked) exports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CreditBalance showBuyButton={false} />
              </div>
              <a
                href="/pricing"
                className="px-4 py-2 rounded-md border border-[#00ffc8] text-[#00ffc8] hover:bg-[#00ffc8]/10 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Buy Credits
              </a>
            </div>
            <p className="text-xs text-gray-500">
              Watermarked exports are always free. Credits never expire.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
