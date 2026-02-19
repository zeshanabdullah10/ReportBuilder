import { Sidebar } from '@/components/app/sidebar'
import '@/app/globals-marketing.css'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[#0a0f14] relative">
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-oscilloscope-grid opacity-30 pointer-events-none" aria-hidden="true" />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-50 pointer-events-none" aria-hidden="true" />

      <Sidebar />
      <main id="main-content" className="flex-1 overflow-auto relative z-10" role="main">
        {children}
      </main>
    </div>
  )
}
