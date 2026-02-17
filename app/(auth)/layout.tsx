import Link from 'next/link'
import { FileText, Activity } from 'lucide-react'
import '@/app/globals-marketing.css'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-oscilloscope-grid relative">
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />

      {/* Header with logo */}
      <div className="p-4 relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00ffc8] blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
            <FileText className="relative h-8 w-8 text-[#00ffc8]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white font-[family-name:var(--font-space-grotesk)]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              LabVIEW Report Builder
            </span>
            <span className="text-xs text-[#00ffc8]/60 font-mono">
              PRECISION REPORTING
            </span>
          </div>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md relative">
          {/* Glow effect behind card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00ffc8]/20 via-[#39ff14]/10 to-[#00ffc8]/20 rounded-2xl blur-xl opacity-50" />

          {/* Auth card */}
          <div className="relative bg-gradient-to-br from-[rgba(10,20,30,0.95)] to-[rgba(15,30,45,0.9)] rounded-2xl border border-[rgba(0,255,200,0.2)] p-8 shadow-2xl">
            {/* Top glow line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00ffc8] to-transparent opacity-50" />

            {/* Status indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39ff14] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39ff14]" />
              </span>
              <span className="text-xs text-gray-500 font-mono">SECURE</span>
            </div>

            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center relative z-10">
        <p className="text-xs text-gray-500 font-mono">
          &copy; 2026 LabVIEW Report Builder • Engineered for Precision
        </p>
      </div>
    </div>
  )
}
