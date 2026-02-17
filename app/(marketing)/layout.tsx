import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import '@/app/globals-marketing.css'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f14]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
