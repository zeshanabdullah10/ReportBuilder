'use client'

import Link from 'next/link'
import { Check, ArrowRight, Sparkles } from 'lucide-react'

const bundles = [
  {
    key: 'starter',
    name: 'Starter Pack',
    price: '$19',
    credits: 10,
    description: 'Perfect for trying out clean exports',
    features: [
      '10 clean exports',
      'No watermark',
      'Credits never expire',
      'Priority support',
    ],
    highlighted: false,
    cta: 'Get Started',
  },
  {
    key: 'pro',
    name: 'Pro Pack',
    price: '$39',
    credits: 25,
    description: 'Best value for regular users',
    features: [
      '25 clean exports',
      'No watermark',
      'Credits never expire',
      'Priority support',
      '37% savings',
    ],
    highlighted: true,
    cta: 'Get Pro Pack',
  },
  {
    key: 'team',
    name: 'Team Pack',
    price: '$69',
    credits: 50,
    description: 'For teams with multiple templates',
    features: [
      '50 clean exports',
      'No watermark',
      'Credits never expire',
      'Priority support',
      '48% savings',
    ],
    highlighted: false,
    cta: 'Get Team Pack',
  },
]

export function PricingPreview() {
  return (
    <section className="relative py-24 bg-[#0a0f14] overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-oscilloscope-grid opacity-20" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,255,200,0.02)] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(0,255,200,0.2)] bg-[rgba(0,255,200,0.05)] mb-6"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Sparkles className="w-4 h-4 text-[#ffb000]" />
            <span className="text-xs text-[#00ffc8] uppercase tracking-widest">Pricing</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Simple, transparent{' '}
            <span className="text-[#00ffc8]" style={{
              textShadow: '0 0 20px rgba(0, 255, 200, 0.4)'
            }}>pricing</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Pay only for what you need. Credits never expire.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {bundles.map((bundle) => (
            <div
              key={bundle.key}
              className={`
                relative p-6 rounded-xl transition-all duration-300
                ${bundle.highlighted
                  ? 'bg-gradient-to-b from-[rgba(0,255,200,0.1)] to-[rgba(0,255,200,0.02)] scale-105'
                  : 'bg-gradient-to-b from-[rgba(10,20,30,0.8)] to-[rgba(5,10,15,0.9)]'
                }
              `}
              style={{
                border: bundle.highlighted
                  ? '2px solid #00ffc8'
                  : '1px solid rgba(0,255,200,0.1)',
                boxShadow: bundle.highlighted
                  ? '0 0 40px rgba(0,255,200,0.15), inset 0 1px 0 rgba(0,255,200,0.1)'
                  : 'none',
              }}
            >
              {/* Best value badge */}
              {bundle.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: '#00ffc8',
                      color: '#0a0f14',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Best Value
                  </span>
                </div>
              )}

              {/* Top glow line */}
              {bundle.highlighted && (
                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#00ffc8] to-transparent" />
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <h3
                  className="text-xl font-semibold text-white mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {bundle.name}
                </h3>
                <div className="mb-2">
                  <span
                    className="text-4xl font-bold"
                    style={{
                      color: bundle.highlighted ? '#00ffc8' : '#9ca3af',
                      fontFamily: "'JetBrains Mono', monospace",
                      textShadow: bundle.highlighted ? '0 0 20px rgba(0, 255, 200, 0.3)' : 'none',
                    }}
                  >
                    {bundle.price}
                  </span>
                  <span className="text-gray-400 text-sm"> one-time</span>
                </div>
                <p className="text-gray-400 text-sm">{bundle.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {bundle.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: bundle.highlighted ? '#00ffc8' : '#39ff14' }}
                    />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/pricing"
                className={`
                  block w-full py-3 px-4 rounded-lg font-semibold text-center transition-all duration-300
                  ${bundle.highlighted
                    ? 'bg-[#00ffc8] text-[#0a0f14] hover:bg-[#39ff14]'
                    : 'bg-transparent border border-[rgba(0,255,200,0.3)] text-[#00ffc8] hover:bg-[rgba(0,255,200,0.05)]'
                  }
                `}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {bundle.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Free tier note */}
        <div className="text-center mt-12">
          <p className="text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-[#00ffc8]">✓</span> Free tier available with 1 template
            <span className="mx-2 text-gray-600">|</span>
            <span className="text-[#00ffc8]">✓</span> No credit card required
          </p>
        </div>

        {/* Link to full pricing */}
        <div className="text-center mt-6">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-[#00ffc8] hover:text-[#39ff14] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            View full pricing details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bottom decoration */}
        <div className="flex items-center justify-center mt-16 gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-[rgba(0,255,200,0.3)]" />
          <div className="w-2 h-2 rotate-45 border border-[#00ffc8]/50" />
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-[rgba(0,255,200,0.3)]" />
        </div>
      </div>
    </section>
  )
}
