'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { Loader2, Mail } from 'lucide-react'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.2)] rounded-lg">
          <Mail className="h-8 w-8 text-[#39ff14] mx-auto mb-2" />
          <p className="text-[#39ff14] font-medium">Check your email</p>
          <p className="text-gray-400 text-sm mt-1">
            We&apos;ve sent a password reset link to your email address.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm text-gray-400">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="mt-1"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm text-red-400 bg-[rgba(255,0,0,0.1)] border border-[rgba(255,0,0,0.2)] rounded-lg">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send reset link
      </Button>
    </form>
  )
}
