# Licensing Approaches for Report Builder

## Final Decision: Component-Based Licensing (One-Time Purchase)

### Model Overview

**Free Tier:**
- Basic components only (Text, Image, Divider, Spacer, Page Break, Page Number, Container)
- Full template builder access
- Preview functionality
- **Unlimited exports** (of basic templates)
- CLI download

**Paid Tier (One-Time Purchase):**
- Unlock ALL advanced components (Charts, Tables, Gauges, Indicators, Progress Bars, etc.)
- Unlimited exports of all templates
- CLI works with all components

### Why This Model Works

| Problem | Solution |
|---------|----------|
| Multiple account abuse | Even with new accounts, advanced components remain locked |
| Temp email bypass | Component gates are server-side, not account-based |
| Subscription fatigue | One-time payment is more appealing |
| Value unclear | Clear value: "Unlock Charts, Tables, Gauges for $X" |
| Export limits confusing | No export limits - just component gates |

### Component Tiers

```
┌─────────────────────────────────────────────────────────────┐
│                    FREE COMPONENTS                           │
├─────────────────────────────────────────────────────────────┤
│  📝 Text          - Basic text display                      │
│  🖼️ Image         - Static images                           │
│  ➖ Divider       - Visual separators                        │
│  📏 Spacer        - Layout spacing                           │
│  📄 Page Break    - Page pagination                          │
│  🔢 Page Number   - Page counters                           │
│  📦 Container     - Basic grouping                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PAID COMPONENTS                           │
├─────────────────────────────────────────────────────────────┤
│  📊 Chart         - Bar, Line, Pie, Scatter charts          │
│  📋 Table         - Data tables with binding                │
│  🎯 Gauge         - Circular progress indicators            │
│  🚦 Indicator     - Pass/Fail status badges                 │
│  📈 Progress Bar  - Linear progress indicators              │
│  📅 DateTime      - Formatted date/time display             │
│  📝 Bullet List   - Dynamic lists                           │
│  📊 Histogram     - Data distribution charts                │
│  📈 Scatter Plot  - XY data visualization                   │
│  🎯 Spec Box      - Specification boxes                     │
│  ✅ Test Summary  - Test result summaries                   │
│  🔔 Tolerance Band - Tolerance indicators                   │
└─────────────────────────────────────────────────────────────┘
```

### User Flow

```
User Signs Up (Free)
        │
        ▼
┌───────────────────────┐
│  Template Builder     │
│  - Basic components: ✅│
│  - Charts: 🔒 LOCKED  │
│  - Tables: 🔒 LOCKED  │
└───────────────────────┘
        │
        ▼
   Design Template
   (using basic components)
        │
        ▼
   Export Template
   (Unlimited exports of basic templates)
        │
        ▼
   User wants Charts/Tables?
        │
        ├─── No ───► Continue with basic (free forever)
        │
        └─── Yes ───► Pay one-time fee ───► Unlock ALL components
                                              │
                                              ▼
                                        Unlimited exports
                                        All components available
```

### Implementation

#### 1. Database Schema

```sql
-- User entitlements
ALTER TABLE users ADD COLUMN component_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN one_time_purchase BOOLEAN DEFAULT false;

-- Component definitions (could also be in code)
-- Free: text, image, divider, spacer, pagebreak, pagenumber, container
-- Paid: chart, table, gauge, indicator, progressbar, datetime, bulletlist, histogram, scatterplot, specbox, testsummarybox, toleranceband
```

#### 2. Builder Component Gate

```typescript
// components/builder/toolbox/ComponentGate.tsx
export function ComponentGate({ componentType, children }) {
  const { user } = useAuth()
  const isPaid = user?.componentTier === 'paid' || user?.one_time_purchase
  
  const requiredTier = getComponentTier(componentType)
  const isLocked = requiredTier === 'paid' && !isPaid
  
  if (isLocked) {
    return (
      <div className="locked-component">
        <LockIcon />
        <span>{componentType}</span>
        <Button onClick={showUpgradeModal}>Unlock</Button>
      </div>
    )
  }
  
  return children
}
```

#### 3. Export Validation (Server-Side)

```typescript
// app/api/templates/[id]/export/route.ts
export async function POST(req, { params }) {
  const user = await getCurrentUser()
  const template = await getTemplate(params.id)
  
  // Check if template contains paid components
  const paidComponents = ['chart', 'table', 'gauge', 'indicator', 'progressbar', 'datetime', 'bulletlist']
  const hasPaidComponents = template.components.some(c => paidComponents.includes(c.type))
  
  if (hasPaidComponents && !user.one_time_purchase) {
    return Response.json({
      error: 'Paid components required',
      message: 'This template contains advanced components. Upgrade to export.',
      upgradeUrl: '/pricing',
      lockedComponents: template.components.filter(c => paidComponents.includes(c.type)).map(c => c.type)
    }, { status: 402 })
  }
  
  // Generate export
  const html = await compileTemplate(template)
  
  return Response.json({ html })
}
```

#### 4. Pricing Page

```tsx
// app/(marketing)/pricing/page.tsx
export default function PricingPage() {
  return (
    <div>
      <h1>Unlock Advanced Components</h1>
      
      <div className="pricing-card">
        <h2>One-Time Purchase</h2>
        <div className="price">$49</div>
        <p>Pay once, use forever</p>
        
        <ul>
          <li>✅ All basic components</li>
          <li>✅ Charts (Bar, Line, Pie, Scatter)</li>
          <li>✅ Data Tables with binding</li>
          <li>✅ Gauges & Indicators</li>
          <li>✅ Progress Bars</li>
          <li>✅ DateTime & Lists</li>
          <li>✅ Unlimited exports</li>
          <li>✅ CLI access</li>
        </ul>
        
        <Button>Unlock Now</Button>
      </div>
    </div>
  )
}
```

### Payment Integration (Stripe One-Time)

```typescript
// app/api/billing/checkout/route.ts
export async function POST(req: Request) {
  const user = await getCurrentUser()
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',  // One-time payment, not subscription
    customer_email: user.email,
    line_items: [{
      price: process.env.STRIPE_COMPONENT_UNLOCK_PRICE_ID,
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/settings?unlocked=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: {
      user_id: user.id,
    },
  })
  
  return Response.json({ url: session.url })
}

// Webhook handler
export async function POST(req: Request) {
  const event = await stripe.webhooks.constructEvent(...)
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata.user_id
    
    await supabase
      .from('users')
      .update({
        one_time_purchase: true,
        component_tier: 'paid'
      })
      .eq('id', userId)
  }
}
```

### Benefits of This Model

1. **Abuse Resistant**: Creating new accounts doesn't unlock components
2. **Clear Value**: Users see exactly what they're paying for
3. **One-Time Payment**: Lower friction than subscriptions
4. **Still Try Before Buy**: Can build basic templates for free
5. **Viral Potential**: Free users share basic templates, upgrade when they need charts

---

## Sustainability Analysis: One-Time Payment vs Ongoing Costs

### The Problem

One-time payment models face a fundamental challenge:
- Revenue comes in once per customer
- Server costs continue indefinitely
- Eventually, costs may exceed revenue from inactive users

### Current Architecture Costs

| Service | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| **Vercel** (hosting) | Free | $20/mo | Free tier: 100GB bandwidth |
| **Supabase** (auth + DB) | Free | $25/mo | Free tier: 500MB DB, 5GB bandwidth |
| **Stripe** | 2.9% + $0.30 | Same | Per transaction |
| **Total** | **Free** | **$45/mo** | With paid tiers |

### Break-Even Analysis

```
Monthly Costs: $45 (if on paid tiers) or $0 (free tiers)
One-time Payment: $49
Stripe Fee: $4.32 (2.9% + $0.30)

Net Revenue per Sale: $44.68

Break-even: 1 sale/month covers paid tier costs
```

### Recommended: Hybrid Model

```
┌─────────────────────────────────────────────────────────────┐
│                 RECOMMENDED MODEL                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  $49 ONE-TIME PURCHASE                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ✅ CLI tool (forever, open-source)                      ││
│  │ ✅ Exported HTML templates (work offline)               ││
│  │ ✅ Cloud builder (1 year included)                      ││
│  │ ✅ All components unlocked                              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  AFTER 1 YEAR (OPTIONAL):                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ $19/year for cloud builder access                       ││
│  │ OR self-host with Docker image                          ││
│  │ OR continue using CLI + exported templates              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  GUARANTEES:                                                 │
│  - CLI will be open-sourced (community can maintain)        │
│  - 6 months notice before any service changes               │
│  - Full template export always available                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Why This Works

1. **CLI works forever** - No ongoing cost for you (user's own machine)
2. **Cloud builder = ongoing cost** - Reasonable to charge annually
3. **Users have choices** - Self-host, renew, or just use CLI
4. **Open source CLI** - Community can maintain if you stop

### Cost Projection (1000 users, 10% renewal)

```
Year 1:
- Sales: 1000 × $49 = $49,000
- Stripe fees: -$4,320
- Net: $44,680
- Server costs: $540/year (free tiers)
- Profit: $44,140

Year 2:
- Renewals: 100 × $19 = $1,900
- New sales: 200 × $49 = $9,800
- Stripe fees: -$1,032
- Net: $10,668
- Server costs: $540/year
- Profit: $10,128

Total 2-year profit: $54,268
Average cost per active user: $0.45/month
```

### Legal/Ethical Obligations

| Aspect | Minimum | Recommended |
|--------|---------|-------------|
| **Notice period** | None | 6 months notice before shutdown |
| **Data export** | None | Provide full template export |
| **Refunds** | None | Prorated for < 1 year users |
| **CLI access** | N/A | CLI should work offline forever |

### Mitigation Strategies

1. **Open Source CLI**: If you ever shut down, CLI continues working
2. **Export Everything**: Users can always export their templates
3. **Self-Host Option**: Provide Docker image for enterprise users
4. **Graceful Wind-Down**: 6+ months notice, prorated refunds
5. **Stay on Free Tiers**: Keep costs minimal until revenue justifies upgrade

---

## Previous Analysis (Alternative Approaches)

## Current Implementation

- Watermark is embedded in HTML via `WATERMARK_HTML` constant
- Added to the exported HTML template
- Can be removed by editing the HTML file before running CLI

## Proposed Approaches

### Approach 1: CLI-Enforced Watermarking (Recommended)

**Concept**: The CLI injects the watermark during PDF generation, not in HTML.

**Implementation**:
```rust
// In report-cli/src/main.rs
fn generate_pdf(temp_html_path: &PathBuf, args: &Args, license: &License) -> Result<()> {
    // Inject watermark into HTML before PDF generation
    if !license.is_paid() {
        let html = fs::read_to_string(temp_html_path)?;
        let watermarked_html = inject_watermark(&html, license.tier());
        fs::write(temp_html_path, watermarked_html)?;
    }
    
    // Generate PDF...
}
```

**Pros**:
- Watermark cannot be removed from HTML (injected at runtime)
- Works completely offline
- License validation happens in compiled Rust binary (harder to reverse engineer)
- Can support different watermark types per tier

**Cons**:
- Rust binary could be patched (but requires reverse engineering)
- Need to distribute different binaries or embed license keys

---

### Approach 2: License Key + CLI Validation

**Concept**: CLI requires a license key file to generate unwatermarked PDFs.

**Implementation**:
```
# License file structure (license.key)
{
  "license_id": "XXXX-XXXX-XXXX",
  "customer": "Company Name",
  "tier": "professional",
  "expires": "2025-12-31",
  "signature": "base64_signature"
}
```

```rust
// CLI validates license before generation
fn validate_license(license_path: &Path) -> Result<License> {
    let license = read_license_file(license_path)?;
    verify_signature(&license)?; // RSA signature verification
    check_expiration(&license)?;
    Ok(license)
}
```

**Pros**:
- Flexible licensing (per-customer, expiration-based)
- Can revoke licenses server-side when online
- Single binary distribution

**Cons**:
- License file could be shared
- Requires online activation at least once

---

### Approach 3: PDF Post-Processing Watermark

**Concept**: CLI adds watermark directly to PDF bytes after generation.

**Implementation**:
```rust
use lopdf::Document;

fn add_pdf_watermark(pdf_bytes: &[u8], watermark_text: &str) -> Result<Vec<u8>> {
    let mut doc = Document::load(pdf_bytes)?;
    
    // Add watermark to each page
    for page_num in doc.get_pages().keys() {
        // Add watermark text layer
        add_watermark_to_page(&mut doc, *page_num, watermark_text);
    }
    
    Ok(doc.save_to_mem()?)
}
```

**Pros**:
- Watermark is in PDF structure (not just visible text)
- Harder to remove without PDF editing tools
- Works with any HTML template

**Cons**:
- Requires PDF manipulation library (`lopdf` or similar)
- More complex implementation
- Could still be removed with PDF editors

---

### Approach 4: Encrypted Template Bundle

**Concept**: Distribute encrypted templates that only the CLI can decrypt.

**Implementation**:
```
# Template bundle structure
template.bundle/
├── template.enc      # Encrypted HTML
├── metadata.json     # Template info
└── assets.enc        # Encrypted assets
```

```rust
fn load_encrypted_template(bundle_path: &Path, license: &License) -> Result<String> {
    let encrypted = fs::read(bundle_path.join("template.enc"))?;
    let key = derive_key(&license.license_id);
    let decrypted = decrypt_aes(encrypted, key)?;
    Ok(String::from_utf8(decrypted)?)
}
```

**Pros**:
- Template cannot be edited without CLI
- Strong protection against modification
- Can embed license checks in decryption

**Cons**:
- Complex implementation
- Users cannot preview template in browser
- Key management challenges

---

### Approach 5: Hardware-Bound Licensing

**Concept**: License tied to specific machine hardware ID.

**Implementation**:
```rust
fn get_machine_id() -> Result<String> {
    // Combine multiple hardware identifiers
    let cpu_id = get_cpu_id()?;
    let disk_id = get_boot_disk_id()?;
    let mac = get_primary_mac()?;
    
    Ok(hash(format!("{}-{}-{}", cpu_id, disk_id, mac)))
}

fn validate_license(license: &License) -> Result<()> {
    let machine_id = get_machine_id()?;
    if license.machine_id != machine_id {
        bail!("License not valid for this machine");
    }
    Ok(())
}
```

**Pros**:
- Prevents license sharing
- Strong offline protection

**Cons**:
- Frustrating for users (can't move license to new machine)
- Hardware changes break license
- Requires support for license transfers

---

## Recommended Implementation: Hybrid Approach

Combine **Approach 1** (CLI-enforced watermarking) with **Approach 2** (license key validation):

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Report Builder App                      │
│  (Next.js - creates templates, manages subscriptions)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Exports template + license file
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      License File                            │
│  {                                                           │
│    "license_id": "XXXX-XXXX",                               │
│    "tier": "professional",                                   │
│    "customer": "Company",                                    │
│    "machine_id": "hashed_id",                               │
│    "expires": "2025-12-31",                                  │
│    "signature": "rsa_signature"                             │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      report-cli                              │
│  1. Validate license signature (embedded public key)        │
│  2. Check expiration                                         │
│  3. Optional: Verify machine_id                              │
│  4. If free/expired: Inject watermark                        │
│  5. Generate PDF                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

1. **Add license validation to CLI**:
   - Add `rsa` and `serde_json` dependencies
   - Embed public key in CLI binary
   - Add `--license` flag for license file path

2. **Create license generation endpoint**:
   - Server-side API to generate signed licenses
   - Store license records in database
   - Link to subscription status

3. **Update export flow**:
   - Include license file with template export
   - CLI validates and applies appropriate watermark

4. **Watermark strategies by tier**:
   | Tier | Watermark |
   |------|-----------|
   | Free | "Generated with LabVIEW Report Builder (Free)" |
   | Trial | "Trial Version - Expires YYYY-MM-DD" |
   | Professional | None |
   | Enterprise | None + custom branding option |

### Code Changes Required

#### CLI Changes (`report-cli/src/main.rs`)

```rust
use rsa::{RsaPublicKey, PKCS1v15Sign};
use sha2::{Sha256, Digest};

struct License {
    license_id: String,
    tier: String,
    customer: String,
    expires: String,
    signature: String,
}

fn validate_license(license_path: &Path) -> Result<License> {
    let content = fs::read_to_string(license_path)?;
    let license: License = serde_json::from_str(&content)?;
    
    // Verify signature with embedded public key
    let public_key = get_embedded_public_key();
    let data_to_verify = format!("{}:{}:{}:{}", 
        license.license_id, license.tier, license.customer, license.expires);
    
    let signature = base64::decode(&license.signature)?;
    let hash = Sha256::digest(data_to_verify.as_bytes());
    
    public_key.verify(PKCS1v15Sign::new::<Sha256>(), &hash, &signature)?;
    
    // Check expiration
    let expires = chrono::DateTime::parse_from_rfc3339(&license.expires)?;
    if expires < chrono::Utc::now() {
        bail!("License has expired");
    }
    
    Ok(license)
}

fn inject_watermark(html: &str, tier: &str) -> String {
    if tier == "professional" || tier == "enterprise" {
        return html.to_string();
    }
    
    let watermark = match tier {
        "free" => r#"<div style="position: fixed; bottom: 20px; right: 20px; ...">Generated with LabVIEW Report Builder (Free)</div>"#,
        "trial" => r#"<div style="...">Trial Version</div>"#,
        _ => "",
    };
    
    html.replace("</body>", &format!("{}{}</body>", watermark))
}
```

#### App Changes (License Generation API)

```typescript
// app/api/licenses/generate/route.ts
import { rsaSign } from '@/lib/crypto'

export async function POST(req: Request) {
  const { customer, tier, expires } = await req.json()
  
  const licenseId = generateLicenseId()
  const dataToSign = `${licenseId}:${tier}:${customer}:${expires}`
  const signature = await rsaSign(dataToSign)
  
  const license = {
    license_id: licenseId,
    tier,
    customer,
    expires,
    signature: base64Encode(signature),
  }
  
  return Response.json(license)
}
```

---

## Security Considerations

1. **Private Key Protection**: The private key for signing licenses must be kept secure on the server
2. **Binary Analysis**: Rust binary can be reverse-engineered, but it's significantly harder than editing HTML
3. **License Sharing**: Without machine binding, licenses can be shared
4. **Expiration Bypass**: System clock manipulation could bypass expiration (consider online checks when possible)

## Next Steps

1. [ ] Add RSA signature dependencies to CLI
2. [ ] Implement license validation in CLI
3. [ ] Create license generation API endpoint
4. [ ] Update export flow to include license file
5. [ ] Add watermark injection to CLI
6. [ ] Test full flow with different license tiers
