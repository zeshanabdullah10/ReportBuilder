import { Hero } from '@/components/marketing/hero'
import { SocialProof } from '@/components/marketing/social-proof'
import { ProblemSolution } from '@/components/marketing/problem-solution'
import { Features } from '@/components/marketing/features'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { Integrations } from '@/components/marketing/integrations'
import { Testimonials } from '@/components/marketing/testimonials'
import { PricingPreview } from '@/components/marketing/pricing-preview'
import { CTA } from '@/components/marketing/cta'

export default function HomePage() {
  return (
    <>
      {/* Hero Section - Main value proposition */}
      <Hero />
      
      {/* Social Proof - Statistics and trust indicators */}
      <SocialProof />
      
      {/* Problem/Solution - Why use this tool */}
      <ProblemSolution />
      
      {/* Features - Organized by value proposition */}
      <Features />
      
      {/* How It Works - 4-step workflow */}
      <HowItWorks />
      
      {/* Integrations - Code examples for different languages */}
      <Integrations />
      
      {/* Testimonials - Customer quotes */}
      <Testimonials />
      
      {/* Pricing Preview - Quick pricing overview */}
      <PricingPreview />
      
      {/* Final CTA - Conversion section */}
      <CTA />
    </>
  )
}
