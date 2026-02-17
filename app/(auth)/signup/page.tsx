import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata = {
  title: 'Sign Up - LabVIEW Report Builder',
  description: 'Create your LabVIEW Report Builder account',
}

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 text-center">Create an account</h1>
      <p className="mt-2 text-slate-600 text-center">
        Start building professional reports for LabVIEW
      </p>

      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
