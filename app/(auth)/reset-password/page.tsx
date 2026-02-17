import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata = {
  title: 'Reset Password - LabVIEW Report Builder',
  description: 'Set your new password',
}

export default function ResetPasswordPage() {
  return (
    <div>
      <h1
        className="text-2xl font-bold text-white text-center"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        Set new password
      </h1>
      <p className="mt-2 text-gray-400 text-center">
        Your new password must be different from previous passwords.
      </p>

      <div className="mt-8">
        <ResetPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        <Link href="/login" className="text-[#00ffc8] hover:text-[#39ff14] font-medium transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
