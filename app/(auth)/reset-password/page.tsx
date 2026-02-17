import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata = {
  title: 'Reset Password - LabVIEW Report Builder',
  description: 'Set your new password',
}

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 text-center">Set new password</h1>
      <p className="mt-2 text-slate-600 text-center">
        Your new password must be different from previous passwords.
      </p>

      <div className="mt-8">
        <ResetPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
