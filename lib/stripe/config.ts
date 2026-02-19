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
