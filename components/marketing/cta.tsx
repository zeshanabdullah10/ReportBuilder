'use client'

import Link from 'next/link'
import { ArrowRight, Rocket, Sparkles, CheckCircle2, FileText, Zap } from 'lucide-react'

export function CTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f14]">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-oscilloscope-grid opacity-30" />
      </div>

      {/* Glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #00ffc8 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #39ff14 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #00ffc8 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Animated border lines */}
      <div className="absolute top-0 left-0 right-0 h-px">
        <div className="h-full bg-gradient-to-r from-transparent via-[#00ffc8]/50 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className="h-full bg-gradient-to-r from-transparent via-[#00ffc8]/30 to-transparent" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(0,255,200,0.3)] bg-[rgba(0,255,200,0.05)] mb-8">
          <Sparkles className="w-4 h-4 text-[#ffb000]" />
          <span
            className="text-sm text-[#00ffc8]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Free tier available • No credit card required
          </span>
        </div>

        {/* Headline */}
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Start building reports{' '}
          <span
            className="relative inline-block"
          >
            <span className="text-[#00ffc8]" style={{
              textShadow: '0 0 30px rgba(0, 255, 200, 0.6), 0 0 60px rgba(0, 255, 200, 0.3)'
            }}>in minutes</span>
          </span>
        </h2>

        <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
          Join engineers who've automated their test reporting. Design once, generate forever.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          {/* Primary CTA */}
          <Link
            href="/signup"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-semibold text-[#0a0f14] rounded-lg overflow-hidden"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-[#00ffc8]" />
            <div className="absolute inset-0 bg-[#39ff14] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Glow effect */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                boxShadow: '0 0 40px rgba(0, 255, 200, 0.5), 0 0 80px rgba(0, 255, 200, 0.3)',
              }}
            />

            <span className="relative z-10 flex items-center gap-3">
              <Rocket className="w-5 h-5" />
              GET STARTED FREE
            </span>
            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Secondary CTA */}
          <Link
            href="/pricing"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-[#00ffc8] border border-[rgba(0,255,200,0.3)] rounded-lg hover:border-[#00ffc8] hover:bg-[rgba(0,255,200,0.05)] transition-all"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            VIEW PRICING
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <TrustItem icon={<FileText className="w-4 h-4" />} text="1 free template" />
          <TrustItem icon={<Zap className="w-4 h-4" />} text="Works offline" />
          <TrustItem icon={<CheckCircle2 className="w-4 h-4" />} text="No watermarks on Pro" />
          <TrustItem icon={<CheckCircle2 className="w-4 h-4" />} text="Cancel anytime" />
        </div>

        {/* Terminal-style decoration */}
        <div className="mt-16 inline-flex items-center gap-2 px-4 py-2 rounded bg-[rgba(0,0,0,0.3)] border border-[rgba(0,255,200,0.1)]">
          <span
            className="text-xs text-gray-500"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            &gt; npm run build-report --template=production
          </span>
          <span className="w-2 h-4 bg-[#00ffc8] animate-pulse" />
        </div>
      </div>
    </section>
  )
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span className="text-[#39ff14]">{icon}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{text}</span>
    </div>
  )
}
