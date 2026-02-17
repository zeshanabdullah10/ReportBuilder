'use client'

import { useRef, useEffect, useState } from 'react'
import { BarChart3, Table, Type, Image, CheckCircle, Layers, TrendingUp, ArrowUpRight } from 'lucide-react'

const features = [
  {
    icon: Type,
    title: 'Rich Text Blocks',
    description: 'Formatted text with variable bindings for dynamic data injection from LabVIEW.',
    metric: '∞ variables',
    status: 'ACTIVE',
  },
  {
    icon: Table,
    title: 'Dynamic Tables',
    description: 'Auto-populate tables from array data in your JSON payload.',
    metric: 'O(n) render',
    status: 'OPTIMIZED',
  },
  {
    icon: BarChart3,
    title: 'Charts & Graphs',
    description: 'Line, bar, pie, and scatter visualizations powered by Chart.js.',
    metric: '8 chart types',
    status: 'READY',
  },
  {
    icon: Image,
    title: 'Images & Logos',
    description: 'Embed company logos, product images, or data-driven visual elements.',
    metric: 'Base64 embed',
    status: 'OFFLINE',
  },
  {
    icon: CheckCircle,
    title: 'Pass/Fail Indicators',
    description: 'Visual status indicators for test results with customizable thresholds.',
    metric: '<1ms eval',
    status: 'ACTIVE',
  },
  {
    icon: Layers,
    title: 'Flexible Layouts',
    description: 'Grid-based layouts with containers, spacers, and page break controls.',
    metric: 'A4/A3/Letter',
    status: 'PRINT-READY',
  },
]

export function Features() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-24 bg-[#0a0f14] overflow-hidden"
    >
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
            <TrendingUp className="w-4 h-4 text-[#00ffc8]" />
            <span className="text-xs text-[#00ffc8] uppercase tracking-widest">Capabilities</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Everything you need for{' '}
            <span className="text-[#00ffc8]" style={{
              textShadow: '0 0 20px rgba(0, 255, 200, 0.4)'
            }}>test reports</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Build professional reports with precision-engineered components.
            No complexity. No bloat. Just results.
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-8 mt-8 pt-8 border-t border-[rgba(0,255,200,0.1)]">
            <Stat value="6" label="Core modules" />
            <Stat value="0" label="External deps" />
            <Stat value="100%" label="Offline capable" />
            <Stat value="<50KB" label="Avg template" />
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`
                group relative p-6 rounded-lg
                bg-gradient-to-br from-[rgba(10,20,30,0.9)] to-[rgba(15,30,45,0.8)]
                border border-[rgba(0,255,200,0.1)]
                hover:border-[rgba(0,255,200,0.3)]
                transition-all duration-500
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
              style={{
                transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
              }}
            >
              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ffc8]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#00ffc8]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#00ffc8]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#00ffc8]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#00ffc8]/30 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Header row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Icon container */}
                  <div className="relative">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[rgba(0,255,200,0.1)] border border-[rgba(0,255,200,0.2)] group-hover:bg-[rgba(0,255,200,0.15)] transition-colors">
                      <feature.icon className="w-5 h-5 text-[#00ffc8]" />
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className="text-[10px] px-2 py-0.5 rounded bg-[rgba(57,255,20,0.1)] text-[#39ff14] border border-[rgba(57,255,20,0.2)]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {feature.status}
                  </span>
                </div>

                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-[#00ffc8] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              {/* Content */}
              <h3
                className="text-lg font-semibold text-white mb-2 group-hover:text-[#00ffc8] transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {feature.title}
              </h3>

              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                {feature.description}
              </p>

              {/* Metric footer */}
              <div className="pt-4 border-t border-[rgba(0,255,200,0.1)] flex items-center justify-between">
                <span
                  className="text-xs text-gray-500"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  METRIC
                </span>
                <span
                  className="text-sm text-[#00ffc8]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {feature.metric}
                </span>
              </div>
            </div>
          ))}
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-2xl font-bold text-[#00ffc8]"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: '0 0 10px rgba(0, 255, 200, 0.3)'
        }}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
    </div>
  )
}
