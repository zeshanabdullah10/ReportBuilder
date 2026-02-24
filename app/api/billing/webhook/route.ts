import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { getCreditsForPrice } from '@/lib/stripe/config'

// Lazy-initialize Supabase client (bypasses RLS with service role)
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
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

    // Get credit amount from metadata (preferred) or lookup from priceId
    let credits = session.metadata?.credits ? parseInt(session.metadata.credits, 10) : null

    if (!credits) {
      credits = getCreditsForPrice(priceId)
    }

    if (!credits) {
      console.error('Unknown price ID:', priceId)
      return NextResponse.json({ error: 'Unknown price' }, { status: 400 })
    }

    // Get current credits and add new credits
    const supabase = getSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    const currentCredits = profile?.credits ?? 0
    const newCredits = currentCredits + credits

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to add credits:', updateError)
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
    }

    console.log(`Added ${credits} credits to user ${userId}`)
  }

  return NextResponse.json({ received: true })
}
