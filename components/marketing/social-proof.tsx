'use client'

import { useEffect, useState, useRef } from 'react'
import { Activity, FileText, Users, Zap } from 'lucide-react'

interface Stat {
  icon: typeof Activity
  value: number
  suffix: string
  label: string
  color: string
}

const stats: Stat[] = [
  {
    icon: FileText,
    value: 10000,
    suffix: '+',
    label: 'Reports Generated',
    color: '#00ffc8',
  },
  {
    icon: Activity,
    value: 500,
    suffix: '+',
    label: 'Templates Created',
    color: '#39ff14',
  },
  {
    icon: Users,
    value: 200,
    suffix: '+',
    label: 'Engineers',
    color: '#ffb000',
  },
  {
    icon: Zap,
    value: 0,
    suffix: '',
    label: 'Server Dependencies',
    color: '#ff6b6b',
  },
]

function AnimatedCounter({ value, suffix, duration = 2000 }: { value: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [isVisible, value, duration])

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

export function SocialProof() {
  return (
    <section className="relative py-16 bg-[#0a0f14] border-y border-[rgba(0,255,200,0.1)]">
      {/* Background grid */}
      <div className="absolute inset-0 bg-oscilloscope-grid opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              {/* Icon */}
              <div 
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                style={{
                  backgroundColor: `${stat.color}10`,
                  border: `1px solid ${stat.color}30`,
                }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>

              {/* Value */}
              <div
                className="text-3xl sm:text-4xl font-bold mb-2"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: stat.color,
                  textShadow: `0 0 20px ${stat.color}40`,
                }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>

              {/* Label */}
              <div
                className="text-sm text-gray-400 uppercase tracking-wider"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Trust message */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Trusted by engineering teams worldwide
          </p>
        </div>

        {/* Decorative line */}
        <div className="flex items-center justify-center mt-8 gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[rgba(0,255,200,0.3)]" />
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ffc8]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffb000]" />
          </div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[rgba(0,255,200,0.3)]" />
        </div>
      </div>
    </section>
  )
}
