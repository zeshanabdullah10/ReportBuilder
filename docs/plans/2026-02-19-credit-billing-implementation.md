# Credit-Based Billing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a credit-based billing system where users purchase export credits that never expire.

**Architecture:** Stripe Checkout handles one-time payments for credit bundles. Webhooks add credits to user profiles. Export API checks/deducts credits for clean exports, free watermarked exports always available.

**Tech Stack:** Stripe, Supabase, Next.js API Routes, React

---

## Task 1: Database Migration - Add Credits Column

**Files:**
- Modify: `types/database.ts`
- Create: Supabase migration (via MCP)

**Step 1: Update TypeScript types**

Edit `types/database.ts` to add `credits` field to profiles table:

```typescript
// In profiles Row, Insert, and Update objects
profiles: {
  Row: {
    id: string
    full_name: string | null
    company: string | null
    created_at: string
    updated_at: string
    credits: number  // ADD THIS
  }
  Insert: {
    id: string
    full_name?: string | null
    company?: string | null
    created_at?: string
    updated_at?: string
    credits?: number  // ADD THIS
  }
  Update: {
    id?: string
    full_name?: string | null
    company?: string | null
    created_at?: string
    updated_at?: string
    credits?: number  // ADD THIS
  }
  Relationships: []
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors (types are valid but column doesn't exist yet in DB)

**Step 3: Create Supabase migration**

Use Supabase MCP to add the column:

```sql
ALTER TABLE profiles ADD COLUMN credits INTEGER DEFAULT 0 NOT NULL;
```

**Step 4: Commit**

```bash
git add types/database.ts
git commit -m "feat: add credits column to profiles schema"
```

---

## Task 2: Stripe Client Setup

**Files:**
- Create: `lib/stripe/client.ts`
- Create: `lib/stripe/config.ts`
- Modify: `.env.example`

**Step 1: Create Stripe client**

Create `lib/stripe/client.ts`:

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})
```

**Step 2: Create credit bundle config**

Create `lib/stripe/config.ts`:

```typescript
export const CREDIT_BUNDLES = {
  starter: {
    name: 'Starter Pack',
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    credits: 10,
    price: 19,
  },
  pro: {
    name: 'Pro Pack',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    credits: 25,
    price: 39,
  },
  team: {
    name: 'Team Pack',
    priceId: process.env.STRIPE_TEAM_PRICE_ID!,
    credits: 50,
    price: 69,
  },
} as const

export type BundleKey = keyof typeof CREDIT_BUNDLES

export function getCreditsForPrice(priceId: string): number | null {
  for (const bundle of Object.values(CREDIT_BUNDLES)) {
    if (bundle.priceId === priceId) {
      return bundle.credits
    }
  }
  return null
}
```

**Step 3: Update .env.example**

```env
# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_TEAM_PRICE_ID=price_xxx
```

**Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add lib/stripe/client.ts lib/stripe/config.ts .env.example
git commit -m "feat: add Stripe client and credit bundle configuration"
```

---

## Task 3: Credits API Route

**Files:**
- Create: `app/api/billing/credits/route.ts`

**Step 1: Create credits GET endpoint**

Create `app/api/billing/credits/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
  }

  return NextResponse.json({ credits: profile?.credits ?? 0 })
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/api/billing/credits/route.ts
git commit -m "feat: add credits balance API endpoint"
```

---

## Task 4: Checkout Session API Route

**Files:**
- Create: `app/api/billing/checkout/route.ts`

**Step 1: Create checkout POST endpoint**

Create `app/api/billing/checkout/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { CREDIT_BUNDLES } from '@/lib/stripe/config'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { priceId } = await request.json()

  if (!priceId) {
    return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
  }

  // Verify priceId is valid
  const bundle = Object.values(CREDIT_BUNDLES).find(b => b.priceId === priceId)
  if (!bundle) {
    return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })
  }

  // Get or create Stripe customer
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId = subscription?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabaseUserId: user.id,
      },
    })
    customerId = customer.id

    // Update subscription record with customer ID
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan_type: 'free',
      })
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?purchase=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?purchase=canceled`,
    metadata: {
      userId: user.id,
      priceId: priceId,
      credits: bundle.credits.toString(),
    },
  })

  return NextResponse.json({ url: session.url })
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/api/billing/checkout/route.ts
git commit -m "feat: add Stripe checkout session API endpoint"
```

---

## Task 5: Webhook Handler

**Files:**
- Create: `app/api/billing/webhook/route.ts`

**Step 1: Create webhook handler**

Create `app/api/billing/webhook/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { getCreditsForPrice } from '@/lib/stripe/config'

// Use service role client for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId
    const priceId = session.metadata?.priceId

    if (!userId || !priceId) {
      console.error('Missing metadata in checkout session')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // Get credit amount for this price
    const credits = getCreditsForPrice(priceId)
    if (!credits) {
      console.error('Unknown price ID:', priceId)
      return NextResponse.json({ error: 'Unknown price' }, { status: 400 })
    }

    // Add credits to user's profile
    const { error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_credits: credits,
    })

    if (error) {
      // Try direct update if RPC doesn't exist
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          credits: supabase.rpc('increment_credits', { amount: credits }),
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Failed to add credits:', updateError)
        return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
      }
    }

    console.log(`Added ${credits} credits to user ${userId}`)
  }

  return NextResponse.json({ received: true })
}
```

**Step 2: Create helper RPC function in Supabase**

Run via Supabase MCP:

```sql
CREATE OR REPLACE FUNCTION add_credits(p_user_id uuid, p_credits integer)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET credits = credits + p_credits
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add app/api/billing/webhook/route.ts
git commit -m "feat: add Stripe webhook handler for credit purchases"
```

---

## Task 6: Credit Balance Component

**Files:**
- Create: `components/billing/credit-balance.tsx`

**Step 1: Create credit balance component**

Create `components/billing/credit-balance.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Zap, Loader2 } from 'lucide-react'

interface CreditBalanceProps {
  showBuyButton?: boolean
  onBuyCredits?: () => void
}

export function CreditBalance({ showBuyButton = true, onBuyCredits }: CreditBalanceProps) {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/billing/credits')
      if (response.ok) {
        const data = await response.json()
        setCredits(data.credits)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#00ffc8]" />
        <span className="text-sm text-gray-300">
          <span className="text-white font-semibold">{credits ?? 0}</span> exports
        </span>
      </div>
      {showBuyButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={onBuyCredits}
          className="text-xs"
        >
          Buy Credits
        </Button>
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/billing/credit-balance.tsx
git commit -m "feat: add credit balance display component"
```

---

## Task 7: Update Pricing Page

**Files:**
- Modify: `components/marketing/pricing-cards.tsx`

**Step 1: Update pricing cards for credit bundles**

Replace entire `components/marketing/pricing-cards.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
    priceIdEnv: 'STRIPE_STARTER_PRICE_ID',
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
    priceIdEnv: 'STRIPE_PRO_PRICE_ID',
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
    priceIdEnv: 'STRIPE_TEAM_PRICE_ID',
    highlighted: false,
  },
]

export function PricingCards() {
  const router = useRouter()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const handleBuy = async (bundle: typeof bundles[0]) => {
    setLoadingKey(bundle.key)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env[`NEXT_PUBLIC_${bundle.priceIdEnv}`],
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
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/marketing/pricing-cards.tsx
git commit -m "feat: update pricing page for credit bundles"
```

---

## Task 8: Update Settings Page

**Files:**
- Modify: `app/(app)/settings/page.tsx`

**Step 1: Update settings page with credits section**

Update the subscription card in `app/(app)/settings/page.tsx`:

```typescript
// Add import at top
import { CreditBalance } from '@/components/billing/credit-balance'
import { Zap, ArrowUpCircle } from 'lucide-react'

// Replace the Subscription Card content:
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Zap className="w-5 h-5 text-[#00ffc8]" />
      Export Credits
    </CardTitle>
    <CardDescription>
      Purchase credits for clean (unwatermarked) exports
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-3xl font-bold text-white">
          {/* Credits will be loaded client-side */}
        </p>
        <CreditBalance showBuyButton={false} />
      </div>
      <Button
        variant="primary"
        onClick={() => window.location.href = '/pricing'}
      >
        <ArrowUpCircle className="w-4 h-4 mr-2" />
        Buy Credits
      </Button>
    </div>
    <p className="text-xs text-gray-500">
      Watermarked exports are always free. Credits never expire.
    </p>
  </CardContent>
</Card>
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/\(app\)/settings/page.tsx
git commit -m "feat: update settings page with credit balance display"
```

---

## Task 9: Update Export Modal with Credit Options

**Files:**
- Modify: `components/builder/export/ExportModal.tsx`

**Step 1: Add watermark option to export modal**

Update `components/builder/export/ExportModal.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { X, Download, AlertCircle, Zap, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  templateId: string
  templateName: string
}

interface ExportOptions {
  filename: string
  includeSampleData: boolean
  pageSize: 'A4' | 'Letter'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  watermark: boolean
}

export function ExportModal({ isOpen, onClose, templateId, templateName }: ExportModalProps) {
  const [filename, setFilename] = useState(templateName)
  const [includeSampleData, setIncludeSampleData] = useState(false)
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4')
  const [margin, setMargin] = useState(20)
  const [watermark, setWatermark] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch credits on mount
  useEffect(() => {
    if (isOpen) {
      fetchCredits()
    }
  }, [isOpen])

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/billing/credits')
      if (response.ok) {
        const data = await response.json()
        setCredits(data.credits)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch(`/api/templates/${templateId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          includeSampleData,
          pageSize,
          margins: { top: margin, right: margin, bottom: margin, left: margin },
          watermark,
        })
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 402) {
          setError('Insufficient credits. Purchase more credits for clean exports.')
          return
        }
        throw new Error(data.error || 'Export failed')
      }

      const html = await response.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.html`
      a.click()
      URL.revokeObjectURL(url)

      // Refresh credits after export
      fetchCredits()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  const hasCredits = credits !== null && credits > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,255,200,0.1)]">
          <h3 className="text-lg font-semibold text-white">Export Template</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Export Type</label>
            <div className="grid grid-cols-2 gap-2">
              {/* Clean Export */}
              <button
                onClick={() => setWatermark(false)}
                disabled={!hasCredits}
                className={`p-3 rounded border text-left transition-colors ${
                  !watermark && hasCredits
                    ? 'border-[#00ffc8] bg-[rgba(0,255,200,0.1)]'
                    : 'border-[rgba(0,255,200,0.2)] hover:border-[rgba(0,255,200,0.4)]'
                } ${!hasCredits ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-[#00ffc8]" />
                  <span className="text-sm font-medium text-white">Clean</span>
                </div>
                <span className="text-xs text-gray-400">
                  {hasCredits ? '1 credit' : 'No credits'}
                </span>
              </button>

              {/* Watermarked Export */}
              <button
                onClick={() => setWatermark(true)}
                className={`p-3 rounded border text-left transition-colors ${
                  watermark
                    ? 'border-[#00ffc8] bg-[rgba(0,255,200,0.1)]'
                    : 'border-[rgba(0,255,200,0.2)] hover:border-[rgba(0,255,200,0.4)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-[#ffb000]" />
                  <span className="text-sm font-medium text-white">Watermarked</span>
                </div>
                <span className="text-xs text-gray-400">Free</span>
              </button>
            </div>
          </div>

          {/* Filename */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">File Name</label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Report Template"
            />
          </div>

          {/* Include sample data */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSampleData}
              onChange={(e) => setIncludeSampleData(e.target.checked)}
              className="rounded border-[rgba(0,255,200,0.2)] bg-[#0a0f14]"
            />
            <span className="text-sm text-gray-300">Include sample data for testing</span>
          </label>

          {/* Page Settings */}
          <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
            <label className="block text-sm text-gray-400 mb-2">Page Settings</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Size</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter')}
                  className="w-full bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded px-3 py-2 text-sm text-white"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Margin (mm)</label>
                <Input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  min={0}
                  max={50}
                />
              </div>
            </div>
          </div>

          {/* Credit Balance Info */}
          {credits !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Credits remaining:</span>
              <span className="text-white font-medium">{credits}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[rgba(0,255,200,0.1)]">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : (
              <><Download className="w-4 h-4 mr-1" /> Download HTML</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/builder/export/ExportModal.tsx
git commit -m "feat: add watermark/credit option to export modal"
```

---

## Task 10: Update Export API with Credit Logic

**Files:**
- Modify: `app/api/templates/[id]/export/route.ts`

**Step 1: Add credit deduction logic**

Update `app/api/templates/[id]/export/route.ts`:

```typescript
/**
 * Template Export API Route
 *
 * POST /api/templates/[id]/export
 * Compiles a template into a standalone HTML file for offline use with LabVIEW.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { compileTemplate, ExportOptions, CanvasState } from '@/lib/export'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get template and verify ownership
  const { data: template, error: fetchError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  if (template.user_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // 3. Parse export options from request body
  const body = await request.json()
  const watermark = body.watermark ?? true // Default to watermarked (free)

  // 4. Handle credit check for clean exports
  if (!watermark) {
    // Get user's credit balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 })
    }

    if (!profile.credits || profile.credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Purchase more credits for clean exports.' },
        { status: 402 }
      )
    }

    // Deduct 1 credit
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id)

    if (deductError) {
      return NextResponse.json({ error: 'Failed to deduct credit' }, { status: 500 })
    }
  }

  // 5. Build export options
  const options: ExportOptions = {
    filename: body.filename || template.name || 'Report',
    includeSampleData: body.includeSampleData ?? false,
    pageSize: body.pageSize || 'A4',
    margins: body.margins || { top: 20, right: 20, bottom: 20, left: 20 },
    includeWatermark: watermark,
  }

  // 6. Compile template
  try {
    const canvasState = template.canvas_state as unknown as CanvasState
    const sampleData = template.sample_data as Record<string, unknown> | null

    const html = await compileTemplate(canvasState, sampleData, options)

    // 7. Return HTML file with download headers
    const filename = `${options.filename}.html`
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to compile template' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/api/templates/\[id\]/export/route.ts
git commit -m "feat: add credit deduction logic to export API"
```

---

## Task 11: Add Stripe Publishable Key to Environment

**Files:**
- Modify: `lib/stripe/config.ts`

**Step 1: Export publishable key for client components**

Update `lib/stripe/config.ts` to include:

```typescript
// Add at top
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

// Keep existing exports...
```

**Step 2: Create client-side bundle config**

Create `lib/stripe/bundles.ts` for client components:

```typescript
// Client-safe bundle info (no secrets)
export const BUNDLE_INFO = [
  {
    key: 'starter',
    name: 'Starter Pack',
    price: '$19',
    credits: 10,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro Pack',
    price: '$39',
    credits: 25,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    highlighted: true,
  },
  {
    key: 'team',
    name: 'Team Pack',
    price: '$69',
    credits: 50,
    priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID!,
    highlighted: false,
  },
] as const
```

**Step 3: Update .env.example**

```env
# Stripe (Server)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Stripe (Client-safe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=price_xxx
```

**Step 4: Commit**

```bash
git add lib/stripe/config.ts lib/stripe/bundles.ts .env.example
git commit -m "feat: add client-safe Stripe bundle configuration"
```

---

## Task 12: Final Verification and Push

**Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Commit and push**

```bash
git push origin feature/template-builder
```

---

## Testing Checklist (Manual)

1. [ ] Add credits column to Supabase via migration
2. [ ] Create Stripe products and get price IDs
3. [ ] Update environment variables
4. [ ] Configure Stripe webhook endpoint
5. [ ] Test credit purchase flow (Stripe test mode)
6. [ ] Verify webhook adds credits
7. [ ] Test clean export deducts credit
8. [ ] Test watermarked export is free
9. [ ] Test insufficient credits returns 402
10. [ ] Verify UI shows credit balance correctly
