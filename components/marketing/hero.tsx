'use client'

import Link from 'next/link'
import { ArrowRight, Layers, FileCode, Cpu, ChevronDown } from 'lucide-react'

// Pre-generated random positions for floating data points (avoid hydration mismatch)
const floatingPoints = [
  { left: 16.26, top: 82.13, duration: 2.54, delay: 0.97 },
  { left: 63.32, top: 34.58, duration: 2.36, delay: 1.81 },
  { left: 45.21, top: 67.89, duration: 3.12, delay: 0.42 },
  { left: 12.45, top: 23.67, duration: 2.89, delay: 1.23 },
  { left: 78.91, top: 56.34, duration: 2.67, delay: 0.65 },
  { left: 34.56, top: 91.23, duration: 3.45, delay: 1.56 },
  { left: 89.12, top: 12.45, duration: 2.23, delay: 0.34 },
  { left: 23.78, top: 78.91, duration: 3.01, delay: 1.89 },
  { left: 56.34, top: 45.67, duration: 2.78, delay: 0.78 },
  { left: 67.89, top: 89.12, duration: 3.34, delay: 1.12 },
  { left: 9.87, top: 34.56, duration: 2.56, delay: 0.56 },
  { left: 41.23, top: 9.87, duration: 3.23, delay: 1.67 },
  { left: 74.56, top: 63.21, duration: 2.45, delay: 0.23 },
  { left: 28.91, top: 52.78, duration: 3.67, delay: 1.45 },
  { left: 85.34, top: 71.23, duration: 2.89, delay: 0.89 },
  { left: 19.67, top: 95.34, duration: 3.12, delay: 1.34 },
  { left: 52.12, top: 28.45, duration: 2.34, delay: 0.67 },
  { left: 93.45, top: 47.89, duration: 3.56, delay: 1.78 },
  { left: 36.78, top: 16.23, duration: 2.12, delay: 0.45 },
  { left: 61.23, top: 84.56, duration: 3.78, delay: 1.01 },
]

// Language/platform icons for trust indicators
const languages = [
  { name: 'Python', color: '#3776AB' },
  { name: 'C#', color: '#512BD4' },
  { name: 'LabVIEW', color: '#FFDB00' },
  { name: 'MATLAB', color: '#E16737' },
  { name: 'JSON', color: '#00ffc8' },
]

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
        {floatingPoints.map((point, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#00ffc8] rounded-full opacity-30"
            style={{
              left: `${point.left}%`,
              top: `${point.top}%`,
              animation: `pulse ${point.duration}s ease-in-out infinite`,
              animationDelay: `${point.delay}s`,
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
                System Online • Works With Any Test Framework
              </span>
            </div>

            {/* Main headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className="block">Test Reports That</span>
              <span className="block mt-2">
                <span className="relative inline-block">
                  <span className="text-[#00ffc8]" style={{
                    textShadow: '0 0 20px rgba(0, 255, 200, 0.5), 0 0 40px rgba(0, 255, 200, 0.2)'
                  }}>Design Themselves</span>
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
              Design report templates visually in your browser. Export self-contained HTML files
              that generate PDFs offline.{' '}
              <span className="text-[#00ffc8] font-mono text-sm">Works with JSON from any language.</span>
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

            {/* Language/platform indicators */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Works with:
              </span>
              {languages.map((lang) => (
                <div key={lang.name} className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: lang.color }}
                  />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{lang.name}</span>
                </div>
              ))}
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
                <FeaturePill icon={<Cpu className="w-4 h-4" />} label="Any Language" />
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
