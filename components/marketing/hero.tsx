'use client'

import Link from 'next/link'
import { ArrowRight, Layers, FileCode, Cpu, ChevronDown } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0f14]">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-oscilloscope-grid opacity-50" />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-mesh-gradient" />

      {/* Animated scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-[#00ffc8]/20 to-transparent"
          style={{
            animation: 'scanDown 8s linear infinite',
          }}
        />
      </div>

      {/* Floating data points */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#00ffc8] rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text */}
          <div>
            {/* Status indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(0,255,200,0.2)] bg-[rgba(0,255,200,0.05)] mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39ff14] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39ff14]" />
              </span>
              <span
                className="text-xs text-[#00ffc8] uppercase tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                System Online • No DIAdem Required
              </span>
            </div>

            {/* Main headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className="block">Professional Reports</span>
              <span className="block mt-2">
                for{' '}
                <span className="relative inline-block">
                  <span className="text-[#00ffc8]" style={{
                    textShadow: '0 0 20px rgba(0, 255, 200, 0.5), 0 0 40px rgba(0, 255, 200, 0.2)'
                  }}>LabVIEW</span>
                  {/* Underline glow */}
                  <svg className="absolute -bottom-2 left-0 w-full h-2" viewBox="0 0 200 8" preserveAspectRatio="none">
                    <path
                      d="M0,4 Q50,0 100,4 T200,4"
                      fill="none"
                      stroke="#00ffc8"
                      strokeWidth="2"
                      opacity="0.5"
                      style={{
                        filter: 'drop-shadow(0 0 4px rgba(0, 255, 200, 0.8))'
                      }}
                    />
                  </svg>
                </span>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
              Design report templates visually in your browser. Download self-contained HTML files
              that generate PDFs offline.{' '}
              <span className="text-[#00ffc8] font-mono text-sm">Zero dependencies. Full control.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/signup"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-[#0a0f14] bg-[#00ffc8] rounded-lg overflow-hidden"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  START BUILDING FREE
                </span>
                <div className="absolute inset-0 bg-[#39ff14] transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/pricing"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-[#00ffc8] border border-[#00ffc8]/30 rounded-lg hover:border-[#00ffc8] hover:bg-[rgba(0,255,200,0.05)] transition-all"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                VIEW PRICING
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#39ff14]" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Offline-first</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#39ff14]" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Self-contained HTML</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#39ff14]" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>JSON data binding</span>
              </div>
            </div>
          </div>

          {/* Right column - Visual */}
          <div className="relative hidden lg:block">
            {/* Oscilloscope-style display */}
            <div className="relative bg-[#0a0f14] border-2 border-[rgba(0,255,200,0.2)] rounded-lg p-6 shadow-2xl"
              style={{
                boxShadow: '0 0 60px rgba(0, 255, 200, 0.1), inset 0 0 60px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Screen bezel */}
              <div className="absolute top-2 left-2 right-2 h-6 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#39ff14]" />
                  <span className="text-[10px] text-[#00ffc8]/50 font-mono">SIGNAL</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-1 bg-[rgba(0,255,200,0.1)] rounded" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Waveform display */}
              <div className="mt-8 h-48 relative overflow-hidden rounded bg-[#050810] border border-[rgba(0,255,200,0.1)]">
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-30">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00ffc8" strokeWidth="0.5" opacity="0.3" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Animated waveform */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <path
                    d="M0,100 Q20,60 40,100 T80,100 T120,100 T160,100 T200,100 T240,100 T280,100 T320,100 T360,100 T400,100"
                    fill="none"
                    stroke="#00ffc8"
                    strokeWidth="2"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(0, 255, 200, 0.8))',
                      animation: 'waveformMove 2s linear infinite'
                    }}
                  />
                  <path
                    d="M0,100 Q30,140 60,100 T120,100 T180,100 T240,100 T300,100 T360,100 T400,100"
                    fill="none"
                    stroke="#39ff14"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(57, 255, 20, 0.6))',
                      animation: 'waveformMove 3s linear infinite reverse'
                    }}
                  />
                </svg>

                {/* Measurement markers */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                  <div className="text-[10px] text-[#00ffc8] font-mono">CH1: 3.2V</div>
                  <div className="text-[10px] text-[#39ff14] font-mono">CH2: 1.8V</div>
                </div>

                {/* Time marker */}
                <div className="absolute bottom-2 right-4 text-[10px] text-[#00ffc8]/50 font-mono">
                  t: 0.5ms/div
                </div>
              </div>

              {/* Control panel */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <FeaturePill icon={<Layers className="w-4 h-4" />} label="Visual Builder" />
                <FeaturePill icon={<FileCode className="w-4 h-4" />} label="HTML Export" />
                <FeaturePill icon={<Cpu className="w-4 h-4" />} label="LabVIEW" />
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border border-dashed border-[rgba(0,255,200,0.2)] rounded-lg" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-dashed border-[rgba(57,255,20,0.2)] rounded-full" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500">
          <span className="text-xs font-mono uppercase tracking-widest">Scroll to explore</span>
          <ChevronDown className="w-5 h-5 animate-bounce text-[#00ffc8]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes scanDown {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
        @keyframes waveformMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-80px); }
        }
      `}</style>
    </section>
  )
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(0,255,200,0.05)] border border-[rgba(0,255,200,0.1)] rounded-lg">
      <span className="text-[#00ffc8]">{icon}</span>
      <span className="text-xs text-gray-400 font-mono">{label}</span>
    </div>
  )
}
