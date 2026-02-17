import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Sign In - LabVIEW Report Builder',
  description: 'Sign in to your LabVIEW Report Builder account',
}

export default function LoginPage() {
  return (
    <div>
      <h1
        className="text-2xl font-bold text-white text-center"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        Sign in
      </h1>
      <p className="mt-2 text-gray-400 text-center">
        Welcome back! Please sign in to your account.
      </p>

      <div className="mt-8">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[#00ffc8] hover:text-[#39ff14] font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  )
}
