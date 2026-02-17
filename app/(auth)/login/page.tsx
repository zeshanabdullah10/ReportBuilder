import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 text-center">Sign in</h1>
      <p className="mt-2 text-slate-600 text-center">
        Welcome back! Please sign in to your account.
      </p>

      <div className="mt-8">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link href="/signup" className="text-primary-600 hover:text-primary-500 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}
