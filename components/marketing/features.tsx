'use client'

import { useRef, useEffect, useState } from 'react'
import { 
  BarChart3, Table, Type, Image, CheckCircle, Layers, TrendingUp, ArrowUpRight,
  Palette, Eye, Paintbrush, Wifi, FileDown, HardDrive, Code, Braces, Globe
} from 'lucide-react'

// Features organized by value proposition category
const categories = [
  {
    title: 'Visual Design',
    description: 'Build beautiful templates without coding',
    icon: Palette,
    color: '#00ffc8',
    features: [
      {
        icon: Layers,
        title: 'Drag-Drop Builder',
        description: 'Intuitive canvas for template design. Position elements freely with pixel-perfect precision.',
        metric: 'Zero code',
        status: 'ACTIVE',
      },
      {
        icon: Eye,
        title: 'Real-time Preview',
        description: 'See changes instantly as you design. What you see is what you get in the final PDF.',
        metric: '<100ms render',
        status: 'LIVE',
      },
      {
        icon: Paintbrush,
        title: 'Custom Styling',
        description: 'Fonts, colors, borders, and branding options. Match your company style guide perfectly.',
        metric: 'CSS flexible',
        status: 'READY',
      },
    ],
  },
  {
    title: 'Offline Capability',
    description: 'Works anywhere, no server required',
    icon: Wifi,
    color: '#39ff14',
    features: [
      {
        icon: FileDown,
        title: 'Self-Contained HTML',
        description: 'All assets embedded in a single file. No external dependencies or network calls needed.',
        metric: '1 file',
        status: 'OFFLINE',
      },
      {
        icon: HardDrive,
        title: 'No Server Required',
        description: 'Generate PDFs without internet access. Perfect for secure facilities and air-gapped networks.',
        metric: '100% offline',
        status: 'SECURE',
      },
      {
        icon: Layers,
        title: 'Version Control Ready',
        description: 'Track template changes in Git. Collaborate with your team using standard workflows.',
        metric: 'Git-friendly',
        status: 'TRACKED',
      },
    ],
  },
  {
    title: 'Universal Integration',
    description: 'Works with any programming language',
    icon: Code,
    color: '#ffb000',
    features: [
      {
        icon: Braces,
        title: 'JSON Data Binding',
        description: 'Connect any data source with simple {{variable}} syntax. Arrays, objects, and nested data supported.',
        metric: 'Any data',
        status: 'FLEXIBLE',
      },
      {
        icon: Globe,
        title: 'Multi-Language Support',
        description: 'Python, C#, LabVIEW, MATLAB, or any language that can write JSON. No SDK required.',
        metric: '5+ languages',
        status: 'UNIVERSAL',
      },
      {
        icon: Table,
        title: 'Dynamic Tables',
        description: 'Auto-populate tables from array data. Headers, rows, and formatting all configurable.',
        metric: 'O(n) render',
        status: 'OPTIMIZED',
      },
    ],
  },
]

// Additional component features
const componentFeatures = [
  {
    icon: BarChart3,
    title: 'Charts & Graphs',
    description: 'Line, bar, pie, and scatter visualizations powered by Chart.js.',
    metric: '8 chart types',
  },
  {
    icon: Type,
    title: 'Rich Text Blocks',
    description: 'Formatted text with variable bindings for dynamic data injection.',
    metric: '∞ variables',
  },
  {
    icon: Image,
    title: 'Images & Logos',
    description: 'Embed company logos, product images, or data-driven visual elements.',
    metric: 'Base64 embed',
  },
  {
    icon: CheckCircle,
    title: 'Pass/Fail Indicators',
    description: 'Visual status indicators for test results with customizable thresholds.',
    metric: '<1ms eval',
  },
]

export function Features() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
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
            }}>professional reports</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Three core pillars that make report generation effortless, no matter your tech stack.
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-8 mt-8 pt-8 border-t border-[rgba(0,255,200,0.1)]">
            <Stat value="12" label="Core components" />
            <Stat value="0" label="External deps" />
            <Stat value="100%" label="Offline capable" />
            <Stat value="<50KB" label="Avg template" />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category, index) => (
            <button
              key={category.title}
              onClick={() => setActiveCategory(index)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300
                ${activeCategory === index
                  ? 'bg-[rgba(0,255,200,0.1)] border-2'
                  : 'bg-transparent border border-[rgba(0,255,200,0.2)] hover:border-[rgba(0,255,200,0.4)]'
                }
              `}
              style={{
                borderColor: activeCategory === index ? category.color : undefined,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <category.icon 
                className="w-5 h-5" 
                style={{ color: activeCategory === index ? category.color : '#00ffc880' }}
              />
              <span 
                className="text-sm"
                style={{ color: activeCategory === index ? category.color : '#9ca3af' }}
              >
                {category.title}
              </span>
            </button>
          ))}
        </div>

        {/* Active category description */}
        <div className="text-center mb-12">
          <p className="text-gray-400 text-lg">
            {categories[activeCategory].description}
          </p>
        </div>

        {/* Features grid for active category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {categories[activeCategory].features.map((feature, index) => (
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
              <div 
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ffc8]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${categories[activeCategory].color}50, transparent)` }}
              />

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
                    <div 
                      className="w-10 h-10 flex items-center justify-center rounded-lg border group-hover:bg-[rgba(0,255,200,0.15)] transition-colors"
                      style={{
                        backgroundColor: 'rgba(0,255,200,0.1)',
                        borderColor: `${categories[activeCategory].color}40`,
                      }}
                    >
                      <feature.icon className="w-5 h-5" style={{ color: categories[activeCategory].color }} />
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className="text-[10px] px-2 py-0.5 rounded border"
                    style={{ 
                      fontFamily: "'JetBrains Mono', monospace",
                      backgroundColor: `${categories[activeCategory].color}10`,
                      color: categories[activeCategory].color,
                      borderColor: `${categories[activeCategory].color}30`,
                    }}
                  >
                    {feature.status}
                  </span>
                </div>

                <ArrowUpRight 
                  className="w-4 h-4 text-gray-600 group-hover:text-[#00ffc8] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" 
                  style={{ color: categories[activeCategory].color }}
                />
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
                  className="text-sm"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: categories[activeCategory].color }}
                >
                  {feature.metric}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Component features section */}
        <div className="border-t border-[rgba(0,255,200,0.1)] pt-16">
          <h3
            className="text-2xl font-bold text-white text-center mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Report Components
          </h3>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Pre-built components designed for test reports. Drag, configure, and done.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {componentFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`
                  p-4 rounded-lg bg-gradient-to-br from-[rgba(10,20,30,0.6)] to-[rgba(15,30,45,0.4)]
                  border border-[rgba(0,255,200,0.1)] hover:border-[rgba(0,255,200,0.3)]
                  transition-all duration-300
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}
                style={{
                  transitionDelay: isVisible ? `${(index + 3) * 100}ms` : '0ms',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <feature.icon className="w-5 h-5 text-[#00ffc8]" />
                  <h4
                    className="font-semibold text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {feature.title}
                  </h4>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {feature.description}
                </p>
                <span
                  className="text-xs text-[#00ffc8]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {feature.metric}
                </span>
              </div>
            ))}
          </div>
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
