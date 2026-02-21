'use client'

import { useState, useEffect, useCallback } from 'react'
import { Quote, Clock, Zap, Shield, Star } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    quote: "Cut our report generation time from 2 hours to 5 minutes. The visual builder is intuitive enough for our interns to use, yet powerful enough for complex test reports.",
    author: "Sarah Chen",
    title: "Test Engineer",
    company: "Aerospace Corp",
    avatar: "SC",
    highlight: "2hrs → 5min",
    icon: Clock,
    color: '#00ffc8',
    rating: 5,
  },
  {
    id: 2,
    quote: "Finally, a reporting tool that works offline. Our secure facilities have no internet access, and this fits perfectly into our air-gapped workflow.",
    author: "Marcus Rodriguez",
    title: "QA Manager",
    company: "Defense Systems Inc",
    avatar: "MR",
    highlight: "100% Offline",
    icon: Shield,
    color: '#39ff14',
    rating: 5,
  },
  {
    id: 3,
    quote: "The JSON integration meant we didn't have to change our Python test framework at all. Just write data and generate. Seamless.",
    author: "David Park",
    title: "Automation Lead",
    company: "Semiconductor Solutions",
    avatar: "DP",
    highlight: "Zero Code Changes",
    icon: Zap,
    color: '#ffb000',
    rating: 5,
  },
  {
    id: 4,
    quote: "We evaluated several reporting solutions. This was the only one that didn't require a server or ongoing subscription. Exactly what we needed.",
    author: "Lisa Thompson",
    title: "Engineering Director",
    company: "Manufacturing Tech",
    avatar: "LT",
    highlight: "No Subscription",
    icon: Clock,
    color: '#00ffc8',
    rating: 5,
  },
  {
    id: 5,
    quote: "The template versioning feature is a game changer. We can track changes and roll back if needed. Proper engineering workflow.",
    author: "James Wilson",
    title: "Systems Engineer",
    company: "Robotics Inc",
    avatar: "JW",
    highlight: "Version Control",
    icon: Zap,
    color: '#39ff14',
    rating: 5,
  },
]

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [nextSlide])

  const activeTestimonial = testimonials[activeIndex]

  return (
    <section className="relative py-24 bg-[#050810] overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-oscilloscope-grid opacity-10" />

      {/* Decorative quote marks */}
      <div className="absolute top-20 left-10 text-[#00ffc8] opacity-5">
        <Quote className="w-48 h-48" />
      </div>
      <div className="absolute bottom-20 right-10 text-[#00ffc8] opacity-5 rotate-180">
        <Quote className="w-48 h-48" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            What engineers{' '}
            <span className="text-[#00ffc8]" style={{
              textShadow: '0 0 20px rgba(0, 255, 200, 0.4)'
            }}>are saying</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Real results from engineering teams using Report Builder.
          </p>
        </div>

        {/* Main testimonial card */}
        <div
          className="relative p-8 md:p-12 rounded-2xl transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${activeTestimonial.color}08, transparent)`,
            border: `1px solid ${activeTestimonial.color}25`,
            boxShadow: `0 0 60px ${activeTestimonial.color}10`,
          }}
        >
          {/* Top glow line */}
          <div
            className="absolute top-0 left-1/4 right-1/4 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${activeTestimonial.color}, transparent)` }}
          />

          {/* Quote icon */}
          <div className="mb-6">
            <Quote
              className="w-10 h-10"
              style={{ color: activeTestimonial.color, opacity: 0.5 }}
            />
          </div>

          {/* Rating stars */}
          <div className="flex gap-1 mb-6">
            {[...Array(activeTestimonial.rating)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 fill-current"
                style={{ color: '#ffb000' }}
              />
            ))}
          </div>

          {/* Quote text */}
          <blockquote
            className="text-xl md:text-2xl text-white leading-relaxed mb-8"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            "{activeTestimonial.quote}"
          </blockquote>

          {/* Highlight badge */}
          <div className="mb-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: `${activeTestimonial.color}12`,
                border: `1px solid ${activeTestimonial.color}25`,
              }}
            >
              <activeTestimonial.icon className="w-4 h-4" style={{ color: activeTestimonial.color }} />
              <span
                className="text-sm font-semibold"
                style={{ color: activeTestimonial.color, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {activeTestimonial.highlight}
              </span>
            </div>
          </div>

          {/* Author info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
              style={{
                backgroundColor: `${activeTestimonial.color}15`,
                color: activeTestimonial.color,
                border: `2px solid ${activeTestimonial.color}30`,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {activeTestimonial.avatar}
            </div>

            {/* Name and title */}
            <div>
              <div className="text-white font-semibold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {activeTestimonial.author}
              </div>
              <div className="text-gray-400">
                {activeTestimonial.title} at {activeTestimonial.company}
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center items-center gap-3 mt-10">
          {testimonials.map((t, index) => (
            <button
              key={t.id}
              onClick={() => setActiveIndex(index)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: activeIndex === index ? '32px' : '8px',
                backgroundColor: activeIndex === index ? t.color : 'rgba(0,255,200,0.2)',
                boxShadow: activeIndex === index ? `0 0 10px ${t.color}50` : 'none',
              }}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
