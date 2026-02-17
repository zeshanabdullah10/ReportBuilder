import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-20 bg-primary-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to build better reports?
        </h2>
        <p className="mt-4 text-lg text-primary-100">
          Start with a free template. Upgrade when you need more.
        </p>
        <div className="mt-8">
          <Link href="/signup">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 bg-white text-primary-600 hover:bg-primary-50"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
