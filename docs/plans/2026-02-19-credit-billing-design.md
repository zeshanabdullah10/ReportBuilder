# Credit-Based Billing Design

**Date:** 2026-02-19
**Status:** Approved
**Author:** Design Session

---

## Overview

Replace the subscription-based billing model with a credit bundle system. Users purchase export credits that never expire, aligning with the intermittent usage pattern of report template creation.

### Key Business Model

- **Free Tier:** Unlimited watermarked exports, 1 template max, no card required
- **Paid Tier:** Purchase credit bundles for clean (unwatermarked) exports
- **Credits never expire**

---

## Database Changes

### Add `credits` column to `profiles` table

```sql
ALTER TABLE profiles ADD COLUMN credits INTEGER DEFAULT 0;
```

### Updated Schema (`types/database.ts`)

```typescript
profiles: {
  Row: {
    // ... existing fields
    credits: number
  }
  Insert: {
    // ... existing fields
    credits?: number
  }
  Update: {
    // ... existing fields
    credits?: number
  }
}
```

**Note:** The `subscriptions` table remains unchanged. It tracks plan_type (free/pro/enterprise) but credits are stored on the profile for simplicity.

---

## Stripe Products

### Credit Bundles

| Product Name | Price | Credits |
|--------------|-------|---------|
| Starter Pack | $19 | 10 exports |
| Pro Pack | $39 | 25 exports |
| Team Pack | $69 | 50 exports |

### Environment Variables

```env
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_TEAM_PRICE_ID=price_xxx
```

### Stripe Configuration

- One-time prices (not recurring/subscriptions)
- No trial period
- Currency: USD

---

## API Routes

### `lib/stripe/client.ts`

Initialize Stripe client:

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})
```

### `app/api/billing/checkout/route.ts` (POST)

Create Stripe Checkout Session:

- **Input:** `{ priceId: string }`
- **Output:** `{ url: string }` - Stripe Checkout URL
- **Behavior:**
  - Get or create Stripe customer for user
  - Create checkout session with mode=`payment`
  - Include priceId in metadata for webhook processing
  - Set success_url and cancel_url

### `app/api/billing/webhook/route.ts` (POST)

Handle Stripe webhook events:

- **Events handled:**
  - `checkout.session.completed` - Add credits after successful payment
- **Behavior:**
  - Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
  - Extract priceId from session metadata
  - Map priceId to credit amount (10, 25, or 50)
  - Update `profiles.credits` by adding purchased amount
  - Return 200 to acknowledge receipt

### `app/api/billing/credits/route.ts` (GET)

Get current user's credit balance:

- **Output:** `{ credits: number }`
- **Behavior:**
  - Authenticate user via Supabase
  - Query `profiles.credits`
  - Return balance

---

## UI Changes

### Pricing Page (`components/marketing/pricing-cards.tsx`)

Replace subscription tiers with credit bundles:

- **Free section:** "Unlimited watermarked exports, 1 template"
- **3 bundle cards:** Starter ($19), Pro ($39), Team ($69)
- **"Buy Now" buttons:** Trigger Stripe checkout

### Credit Balance Component (`components/billing/credit-balance.tsx`)

Reusable component to display credit status:

- Shows "X exports remaining"
- "Buy Credits" button when low
- Used in header and settings page

### Settings Page (`app/(app)/settings/page.tsx`)

Update billing section:

- Show current credit balance prominently
- "Buy Credits" button
- Link to purchase history (optional)

### Export Modal (`components/builder/export/ExportModal.tsx`)

Add credit-based options:

- **If credits > 0:** Show "Clean export (1 credit)" option
- **If credits = 0:** Show "Watermarked (free)" + "Buy credits" link
- **Default:** Clean export if user has credits

---

## Export Flow

### Modified Export API (`app/api/templates/[id]/export/route.ts`)

**Request body:**
```typescript
{
  filename: string
  includeSampleData: boolean
  pageSize: 'A4' | 'Letter'
  margins: { top, right, bottom, left }
  watermark: boolean  // NEW: true = free, false = uses credit
}
```

**Credit check logic:**

1. If `watermark=false` (clean export):
   - Query `profiles.credits` for user
   - If credits > 0:
     - Deduct 1 credit: `UPDATE profiles SET credits = credits - 1 WHERE id = $userId`
     - Proceed with clean export
   - If credits = 0:
     - Return 402 Payment Required: `{ error: "Insufficient credits" }`

2. If `watermark=true`:
   - No credit check
   - Include watermark in exported HTML

### Watermark Implementation

The watermark system already exists:
- `WATERMARK_HTML` constant in `lib/export/runtime-template.ts`
- `includeWatermark` option in `compileTemplate()`

---

## Security Considerations

1. **Webhook verification:** Always verify Stripe signature
2. **Idempotency:** Handle duplicate webhook deliveries gracefully
3. **Race conditions:** Use database transactions for credit deduction
4. **Authentication:** All billing routes require authenticated user

---

## File Structure

```
lib/
├── stripe/
│   └── client.ts          # Stripe client initialization

app/api/billing/
├── checkout/
│   └── route.ts           # Create checkout session
├── webhook/
│   └── route.ts           # Handle Stripe webhooks
└── credits/
    └── route.ts           # Get credit balance

components/billing/
└── credit-balance.tsx     # Credit display component
```

---

## Testing Checklist

1. [ ] Credit bundle purchase flow works end-to-end
2. [ ] Credits added correctly after payment
3. [ ] Clean export deducts 1 credit
4. [ ] Watermarked export is free (no deduction)
5. [ ] Insufficient credits returns proper error
6. [ ] Webhook handles duplicate events idempotently
7. [ ] Credit balance displays correctly in UI
