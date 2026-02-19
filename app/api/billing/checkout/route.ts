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
