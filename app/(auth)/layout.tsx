import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary-600" />
          <span className="font-bold text-xl text-slate-900">LabVIEW Report Builder</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
