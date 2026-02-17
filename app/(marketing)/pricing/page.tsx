import { PricingCards } from '@/components/marketing/pricing-cards'
import { PricingFAQ } from '@/components/marketing/pricing-faq'

export const metadata = {
  title: 'Pricing - LabVIEW Report Builder',
  description: 'Choose the plan that fits your needs. From free templates to enterprise solutions.',
}

export default function PricingPage() {
  return (
    <div className="py-16 relative">
      {/* Grid background overlay */}
      <div className="absolute inset-0 bg-oscilloscope-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(0,255,200,0.3)] bg-[rgba(0,255,200,0.05)] mb-6">
            <span
              className="text-xs font-mono uppercase tracking-wider text-[#00ffc8]"
            >
              PRICING
            </span>
          </div>

          <h1
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Simple,{' '}
            <span className="text-[#00ffc8]" style={{ textShadow: '0 0 20px rgba(0, 255, 200, 0.3)' }}>
              transparent
            </span>{' '}
            pricing
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include core features.
          </p>
        </div>
        <PricingCards />
        <PricingFAQ />
      </div>
    </div>
  )
}
