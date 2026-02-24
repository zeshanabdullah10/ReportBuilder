'use client'

import { useState } from 'react'
import { X, Check, ArrowRight, Clock, FileSpreadsheet, AlertCircle, RefreshCw } from 'lucide-react'

const problems = [
  {
    icon: Clock,
    title: 'Hours of Manual Work',
    description: 'Copy-pasting data into Word or Excel for every single report.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Inconsistent Formatting',
    description: 'Every report looks different. Brand guidelines ignored.',
  },
  {
    icon: AlertCircle,
    title: 'Error-Prone Process',
    description: 'Manual data entry leads to mistakes and rework.',
  },
  {
    icon: RefreshCw,
    title: 'Hard to Update',
    description: 'Template changes require updating multiple files.',
  },
]

const solutions = [
  {
    icon: Check,
    title: 'Design Once, Generate Forever',
    description: 'Create your template visually. Generate unlimited reports automatically.',
  },
  {
    icon: Check,
    title: 'Consistent Every Time',
    description: 'Every report matches your exact specifications. Perfect branding.',
  },
  {
    icon: Check,
    title: 'Zero Manual Entry',
    description: 'JSON data binding fills in all values. No typos, no errors.',
  },
  {
    icon: Check,
    title: 'Single Source of Truth',
    description: 'Update the template once. All future reports use the new version.',
  },
]

export function ProblemSolution() {
  const [showSolution, setShowSolution] = useState(false)

  return (
    <section className="relative py-24 bg-[#050810] overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-oscilloscope-grid opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            The Old Way vs.{' '}
            <span className="text-[#00ffc8]" style={{
              textShadow: '0 0 20px rgba(0, 255, 200, 0.4)'
            }}>The Better Way</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Stop wasting time on manual report formatting. Start automating.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <button
            onClick={() => setShowSolution(false)}
            className={`
              px-6 py-3 rounded-l-lg font-semibold transition-all duration-300
              ${!showSolution
                ? 'bg-[#ff6b6b20] text-[#ff6b6b] border-2 border-[#ff6b6b]'
                : 'bg-transparent text-gray-500 border border-[rgba(255,255,255,0.1)]'
              }
            `}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <X className="w-4 h-4 inline mr-2" />
            The Old Way
          </button>
          <button
            onClick={() => setShowSolution(true)}
            className={`
              px-6 py-3 rounded-r-lg font-semibold transition-all duration-300
              ${showSolution
                ? 'bg-[rgba(0,255,200,0.1)] text-[#00ffc8] border-2 border-[#00ffc8]'
                : 'bg-transparent text-gray-500 border border-[rgba(255,255,255,0.1)]'
              }
            `}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Check className="w-4 h-4 inline mr-2" />
            The Better Way
          </button>
        </div>

        {/* Content */}
        <div className="relative min-h-[400px]">
          {/* Problems */}
          <div
            className={`
              absolute inset-0 transition-all duration-500
              ${showSolution ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'}
            `}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {problems.map((problem, index) => (
                <div
                  key={problem.title}
                  className="p-6 rounded-lg bg-gradient-to-br from-[rgba(255,107,107,0.05)] to-transparent border border-[rgba(255,107,107,0.2)]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)]">
                      <problem.icon className="w-5 h-5 text-[#ff6b6b]" />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-semibold text-white mb-2"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {problem.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Arrow to solution */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowSolution(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[rgba(0,255,200,0.3)] text-[#00ffc8] hover:bg-[rgba(0,255,200,0.05)] transition-all"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                See The Better Way
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Solutions */}
          <div
            className={`
              absolute inset-0 transition-all duration-500
              ${showSolution ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[100%]'}
            `}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {solutions.map((solution, index) => (
                <div
                  key={solution.title}
                  className="p-6 rounded-lg bg-gradient-to-br from-[rgba(0,255,200,0.05)] to-transparent border border-[rgba(0,255,200,0.2)]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[rgba(0,255,200,0.1)] border border-[rgba(0,255,200,0.2)]">
                      <solution.icon className="w-5 h-5 text-[#00ffc8]" />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-semibold text-white mb-2"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {solution.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Success indicator */}
            <div className="flex justify-center mt-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.2)]">
                <div className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse" />
                <span
                  className="text-sm text-[#39ff14]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Ready to transform your workflow?
                </span>
              </div>
            </div>
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
