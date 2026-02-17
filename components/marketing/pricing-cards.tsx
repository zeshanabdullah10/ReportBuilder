import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out the platform',
    features: [
      '1 template',
      'Watermarked PDFs',
      'Community support',
      'Basic components',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For individual engineers and small teams',
    features: [
      'Unlimited templates',
      'No watermarks',
      'Priority email support',
      'All components',
      'Custom branding',
      'Template sharing',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: 'per month',
    description: 'For teams with advanced needs',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Custom branding',
      'API access',
      'SSO authentication',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export function PricingCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={`relative ${
            plan.highlighted
              ? 'border-[#00ffc8] border-2 shadow-[0_0_30px_rgba(0,255,200,0.2)] scale-105'
              : ''
          }`}
        >
          {plan.highlighted && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-[#00ffc8] text-[#0a0f14] text-xs font-semibold px-3 py-1 rounded-full font-mono uppercase">
                Most Popular
              </span>
            </div>
          )}
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
            <div className="mt-4">
              <span
                className="text-4xl font-bold text-[#00ffc8]"
                style={{ textShadow: '0 0 20px rgba(0, 255, 200, 0.3)' }}
              >
                {plan.price}
              </span>
              <span className="text-gray-400">/{plan.period}</span>
            </div>
            <CardDescription className="mt-2">{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#00ffc8] flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={plan.highlighted ? 'primary' : 'outline'}
            >
              {plan.cta}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
