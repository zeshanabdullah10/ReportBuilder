import { Sidebar } from '@/components/app/sidebar'
import '@/app/globals-marketing.css'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[#0a0f14] relative">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-oscilloscope-grid opacity-30 pointer-events-none" />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-50 pointer-events-none" />

      <Sidebar />
      <main className="flex-1 overflow-auto relative z-10">
        {children}
      </main>
    </div>
  )
}
