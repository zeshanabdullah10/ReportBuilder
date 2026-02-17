import { PricingCards } from '@/components/marketing/pricing-cards'
import { PricingFAQ } from '@/components/marketing/pricing-faq'

export const metadata = {
  title: 'Pricing - LabVIEW Report Builder',
  description: 'Choose the plan that fits your needs. From free templates to enterprise solutions.',
}

export default function PricingPage() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Choose the plan that fits your needs. All plans include core features.
          </p>
        </div>
        <PricingCards />
        <PricingFAQ />
      </div>
    </div>
  )
}
