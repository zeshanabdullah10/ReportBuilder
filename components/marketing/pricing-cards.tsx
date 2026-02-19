'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'

const bundles = [
  {
    key: 'starter',
    name: 'Starter Pack',
    price: '$19',
    credits: 10,
    description: 'Perfect for trying out clean exports',
    features: [
      '10 clean exports',
      'No watermark',
      'Credits never expire',
      'Priority support',
    ],
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro Pack',
    price: '$39',
    credits: 25,
    description: 'Best value for regular users',
    features: [
      '25 clean exports',
      'No watermark',
      'Credits never expire',
      'Priority support',
      '37% savings',
    ],
    highlighted: true,
  },
  {
    key: 'team',
    name: 'Team Pack',
    price: '$69',
    credits: 50,
    description: 'For teams with multiple templates',
    features: [
      '50 clean exports',
      'No watermark',
      'Credits never expire',
      'Priority support',
      '48% savings',
    ],
    highlighted: false,
  },
]

export function PricingCards() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const handleBuy = async (bundle: typeof bundles[0]) => {
    setLoadingKey(bundle.key)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleKey: bundle.key,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const error = await response.json()
        console.error('Checkout error:', error)
        setLoadingKey(null)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setLoadingKey(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {bundles.map((bundle) => (
        <Card
          key={bundle.key}
          className={`relative ${
            bundle.highlighted
              ? 'border-[#00ffc8] border-2 shadow-[0_0_30px_rgba(0,255,200,0.2)] scale-105'
              : ''
          }`}
        >
          {bundle.highlighted && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-[#00ffc8] text-[#0a0f14] text-xs font-semibold px-3 py-1 rounded-full font-mono uppercase">
                Best Value
              </span>
            </div>
          )}
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">{bundle.name}</CardTitle>
            <div className="mt-4">
              <span
                className="text-4xl font-bold text-[#00ffc8]"
                style={{ textShadow: '0 0 20px rgba(0, 255, 200, 0.3)' }}
              >
                {bundle.price}
              </span>
              <span className="text-gray-400"> one-time</span>
            </div>
            <CardDescription className="mt-2">{bundle.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {bundle.features.map((feature) => (
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
              variant={bundle.highlighted ? 'primary' : 'outline'}
              onClick={() => handleBuy(bundle)}
              disabled={loadingKey !== null}
            >
              {loadingKey === bundle.key ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                'Buy Now'
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
