import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { CREDIT_BUNDLES, BundleKey } from '@/lib/stripe/config'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bundleKey } = await request.json()

  if (!bundleKey) {
    return NextResponse.json({ error: 'Bundle key is required' }, { status: 400 })
  }

  // Get bundle and priceId from config
  const bundle = CREDIT_BUNDLES[bundleKey as BundleKey]
  if (!bundle) {
    return NextResponse.json({ error: 'Invalid bundle key' }, { status: 400 })
  }

  const priceId = bundle.priceId

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
