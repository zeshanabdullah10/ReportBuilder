import { Hero } from '@/components/marketing/hero'
import { Features } from '@/components/marketing/features'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { CTA } from '@/components/marketing/cta'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </>
  )
}
