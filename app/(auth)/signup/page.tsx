import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata = {
  title: 'Sign Up - LabVIEW Report Builder',
  description: 'Create your LabVIEW Report Builder account',
}

export default function SignupPage() {
  return (
    <div>
      <h1
        className="text-2xl font-bold text-white text-center"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        Create an account
      </h1>
      <p className="mt-2 text-gray-400 text-center">
        Start building professional reports for LabVIEW
      </p>

      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-[#00ffc8] hover:text-[#39ff14] font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
