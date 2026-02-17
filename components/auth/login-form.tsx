'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { loginAction } from '@/app/actions/auth'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Sign in
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, null)

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="mt-1"
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-1"
          required
        />
      </div>

      {state?.error && (
        <div className="p-3 text-sm text-red-400 bg-[rgba(255,0,0,0.1)] border border-[rgba(255,0,0,0.2)] rounded-lg">
          {state.error}
        </div>
      )}

      <SubmitButton />

      <div className="text-center text-sm">
        <Link href="/forgot-password" className="text-[#00ffc8] hover:text-[#39ff14] transition-colors">
          Forgot your password?
        </Link>
      </div>
    </form>
  )
}
