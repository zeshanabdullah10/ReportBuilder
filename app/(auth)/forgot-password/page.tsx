import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata = {
  title: 'Forgot Password - LabVIEW Report Builder',
  description: 'Reset your password',
}

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 text-center">Forgot password?</h1>
      <p className="mt-2 text-slate-600 text-center">
        No worries, we'll send you reset instructions.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
