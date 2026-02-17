import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata = {
  title: 'Forgot Password - LabVIEW Report Builder',
  description: 'Reset your password',
}

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1
        className="text-2xl font-bold text-white text-center"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        Forgot password?
      </h1>
      <p className="mt-2 text-gray-400 text-center">
        No worries, we&apos;ll send you reset instructions.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        <Link href="/login" className="text-[#00ffc8] hover:text-[#39ff14] font-medium transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
