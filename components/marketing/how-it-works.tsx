'use client'

import { useRef, useEffect, useState } from 'react'
import { Palette, Download, FileJson, ArrowRight, Zap } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Palette,
    title: 'Design Your Template',
    description: 'Use the visual builder to create your report layout. Drag components, configure styles, and define data bindings.',
    code: 'template.create()',
    color: '#00ffc8',
  },
  {
    step: '02',
    icon: Download,
    title: 'Download HTML',
    description: 'Export your template as a single self-contained HTML file with all dependencies embedded inline.',
    code: 'export.html()',
    color: '#39ff14',
  },
  {
    step: '03',
    icon: FileJson,
    title: 'Integrate with LabVIEW',
    description: 'Write test data to a JSON file. LabVIEW calls headless Chrome to generate PDFs automatically.',
    code: 'generate.pdf()',
    color: '#ffb000',
  },
]

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section ref={sectionRef} className="relative py-24 bg-[#050810] overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-oscilloscope-grid opacity-10" />
      </div>

      {/* Animated data flow lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-px">
          <div
            className="w-32 h-full bg-gradient-to-r from-transparent via-[#00ffc8]/30 to-transparent"
            style={{ animation: 'dataFlowHorizontal 4s linear infinite' }}
          />
        </div>
        <div className="absolute top-3/4 left-0 w-full h-px">
          <div
            className="w-24 h-full bg-gradient-to-r from-transparent via-[#39ff14]/30 to-transparent"
            style={{ animation: 'dataFlowHorizontal 5s linear infinite reverse' }}
          />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(0,255,200,0.2)] bg-[rgba(0,255,200,0.05)] mb-6"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Zap className="w-4 h-4 text-[#00ffc8]" />
            <span className="text-xs text-[#00ffc8] uppercase tracking-widest">Workflow</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            From design to PDF{' '}
            <span className="text-[#00ffc8]" style={{
              textShadow: '0 0 20px rgba(0, 255, 200, 0.4)'
            }}>in 3 steps</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Streamlined workflow designed for engineers who value their time.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,255,200,0.2)] to-transparent hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className={`
                  relative group cursor-pointer
                  transition-all duration-500
                  ${activeStep === index ? 'scale-105' : 'scale-100 opacity-70 hover:opacity-100'}
                `}
                onClick={() => setActiveStep(index)}
              >
                {/* Step number - hexagonal style */}
                <div className="flex justify-center mb-8">
                  <div
                    className="relative w-20 h-20 flex items-center justify-center"
                    style={{
                      background: activeStep === index
                        ? `linear-gradient(135deg, ${step.color}20, ${step.color}05)`
                        : 'transparent',
                    }}
                  >
                    {/* Hexagon border */}
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 80 80"
                      fill="none"
                    >
                      <path
                        d="M40 2 L75 20 L75 60 L40 78 L5 60 L5 20 Z"
                        stroke={activeStep === index ? step.color : 'rgba(0,255,200,0.2)'}
                        strokeWidth="2"
                        fill="none"
                        style={{
                          filter: activeStep === index
                            ? `drop-shadow(0 0 10px ${step.color}50)`
                            : 'none'
                        }}
                      />
                    </svg>

                    {/* Step number */}
                    <span
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: activeStep === index ? step.color : 'rgba(0,255,200,0.5)',
                        textShadow: activeStep === index
                          ? `0 0 20px ${step.color}80`
                          : 'none'
                      }}
                    >
                      {step.step}
                    </span>

                    {/* Pulse animation on active */}
                    {activeStep === index && (
                      <div
                        className="absolute inset-0 animate-ping rounded-lg opacity-20"
                        style={{ background: step.color }}
                      />
                    )}
                  </div>
                </div>

                {/* Content card */}
                <div
                  className={`
                    relative p-6 rounded-lg text-center
                    bg-gradient-to-b from-[rgba(10,20,30,0.8)] to-[rgba(5,10,15,0.9)]
                    border transition-all duration-300
                    ${activeStep === index
                      ? 'border-[rgba(0,255,200,0.3)]'
                      : 'border-[rgba(0,255,200,0.1)] group-hover:border-[rgba(0,255,200,0.2)]'
                    }
                  `}
                  style={{
                    boxShadow: activeStep === index
                      ? `0 0 30px ${step.color}10, inset 0 1px 0 ${step.color}20`
                      : 'none'
                  }}
                >
                  {/* Top glow line */}
                  {activeStep === index && (
                    <div
                      className="absolute top-0 left-1/4 right-1/4 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${step.color}, transparent)` }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`
                      inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4
                      transition-all duration-300
                    `}
                    style={{
                      background: activeStep === index
                        ? `${step.color}20`
                        : 'rgba(0,255,200,0.1)',
                      border: `1px solid ${activeStep === index ? step.color + '40' : 'rgba(0,255,200,0.2)'}`,
                    }}
                  >
                    <step.icon
                      className="w-6 h-6 transition-colors"
                      style={{ color: activeStep === index ? step.color : '#00ffc880' }}
                    />
                  </div>

                  <h3
                    className="text-xl font-semibold text-white mb-3"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {step.title}
                  </h3>

                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    {step.description}
                  </p>

                  {/* Code snippet */}
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[rgba(0,0,0,0.3)] border border-[rgba(0,255,200,0.1)]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span className="text-gray-500">&gt;</span>
                    <span className="text-sm" style={{ color: step.color }}>{step.code}</span>
                    {activeStep === index && (
                      <span className="w-2 h-4 bg-[#00ffc8] animate-pulse ml-1" />
                    )}
                  </div>
                </div>

                {/* Arrow to next step */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                    <ArrowRight
                      className="w-5 h-5 text-[#00ffc8]/30"
                      style={{
                        filter: activeStep === index ? 'drop-shadow(0 0 4px rgba(0,255,200,0.5))' : 'none',
                        color: activeStep === index ? '#00ffc8' : undefined
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-12">
          {steps.map((step, index) => (
            <button
              key={step.step}
              onClick={() => setActiveStep(index)}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${activeStep === index
                  ? 'w-8 bg-[#00ffc8]'
                  : 'bg-[rgba(0,255,200,0.2)] hover:bg-[rgba(0,255,200,0.4)]'
                }
              `}
              style={{
                boxShadow: activeStep === index ? '0 0 10px rgba(0,255,200,0.5)' : 'none'
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes dataFlowHorizontal {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(calc(100vw + 100%)); }
        }
      `}</style>
    </section>
  )
}
