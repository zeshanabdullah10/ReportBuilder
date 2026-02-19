'use client'

import { useActionState } from 'react'
import { updateProfileAction } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'

interface ProfileFormProps {
  initialFullName: string
  initialCompany: string
}

export function ProfileForm({ initialFullName, initialCompany }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null)

  return (
    <form className="space-y-4" action={formAction}>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Full Name
        </label>
        <Input
          name="fullName"
          defaultValue={initialFullName}
          placeholder="Your name"
          disabled={isPending}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Company
        </label>
        <Input
          name="company"
          defaultValue={initialCompany}
          placeholder="Your company"
          disabled={isPending}
        />
      </div>

      {/* Status Messages */}
      {state?.error && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{state.error}</p>
        </div>
      )}
      {state?.success && (
        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-400 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Profile updated successfully
          </p>
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Save changes'
        )}
      </Button>
    </form>
  )
}
