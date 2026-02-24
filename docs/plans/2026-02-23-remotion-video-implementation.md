# Remotion Demo Video Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a 2:30 marketing video showcasing the LabVIEW Report Builder product journey using Remotion.

**Architecture:** Standalone Remotion project in `remotion/` directory with React components recreating the UI, oscilloscope-themed visual effects, and multiple aspect ratio compositions.

**Tech Stack:** Remotion, React, TypeScript, Tailwind CSS (copied theme)

---

## Phase 1: Project Setup

### Task 1: Initialize Remotion Project

**Files:**
- Create: `remotion/` directory structure

**Step 1: Create Remotion project**

```bash
cd "C:\Users\zeesh\OneDrive\Desktop\LabVIEW Report Builder"
npx create-video@latest remotion
```

When prompted:
- Select TypeScript
- Select Tailwind CSS
- Skip ESLint/Prettier for now

**Step 2: Verify project structure created**

```bash
ls remotion/
```

Expected: `package.json`, `src/`, `public/` directories exist

**Step 3: Commit**

```bash
git add remotion/
git commit -m "chore: initialize Remotion project"
```

---

### Task 2: Configure Theme and Tailwind

**Files:**
- Create: `remotion/src/config/theme.ts`
- Modify: `remotion/tailwind.config.js`

**Step 1: Create theme config**

Create `remotion/src/config/theme.ts`:
```typescript
export const theme = {
  colors: {
    phosphor: {
      cyan: '#00ffc8',
      green: '#39ff14',
      amber: '#ffb000',
    },
    oscilloscope: {
      bg: '#0a0f14',
      bgDark: '#050810',
      grid: 'rgba(0, 255, 200, 0.08)',
      border: 'rgba(0, 255, 200, 0.15)',
    },
  },
  fonts: {
    heading: "'Space Grotesk', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  // Timing constants (in frames at 30fps)
  timing: {
    fps: 30,
    intro: { start: 0, duration: 450 },      // 0:00-0:15 (450 frames)
    homepage: { start: 450, duration: 900 }, // 0:15-0:45
    signup: { start: 1350, duration: 450 },  // 0:45-1:00
    dashboard: { start: 1800, duration: 600 }, // 1:00-1:20
    builder: { start: 2400, duration: 1500 }, // 1:20-2:10
    export: { start: 3900, duration: 300 },   // 2:10-2:20
    outro: { start: 4200, duration: 300 },    // 2:20-2:30
  },
} as const;
```

**Step 2: Update Tailwind config**

Replace `remotion/tailwind.config.js`:
```javascript
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        phosphor: {
          cyan: '#00ffc8',
          green: '#39ff14',
          amber: '#ffb000',
        },
        oscilloscope: {
          bg: '#0a0f14',
          bgDark: '#050810',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

**Step 3: Commit**

```bash
git add remotion/src/config/ remotion/tailwind.config.js
git commit -m "chore: configure theme and Tailwind"
```

---

### Task 3: Add Google Fonts

**Files:**
- Modify: `remotion/src/Root.tsx`

**Step 1: Load fonts in Root.tsx**

Add at top of `remotion/src/Root.tsx`:
```typescript
import {loadFont} from '@remotion/google-fonts';

loadFont('SpaceGrotesk', {weights: ['400', '500', '600', '700']});
loadFont('JetBrainsMono', {weights: ['400', '500']});
```

**Step 2: Commit**

```bash
git add remotion/src/Root.tsx
git commit -m "chore: load Google fonts"
```

---

## Phase 2: Layout & Effects Components

### Task 4: Create Layout Components

**Files:**
- Create: `remotion/src/components/layout/Background.tsx`
- Create: `remotion/src/components/layout/Grid.tsx`
- Create: `remotion/src/components/layout/index.ts`

**Step 1: Create Background**

Create `remotion/src/components/layout/Background.tsx`:
```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';

export const Background: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: '#0a0f14'}}>
    {children}
  </AbsoluteFill>
);
```

**Step 2: Create Grid overlay**

Create `remotion/src/components/layout/Grid.tsx`:
```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';

export const Grid: React.FC<{opacity?: number}> = ({opacity = 0.1}) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage: `
        linear-gradient(rgba(0, 255, 200, 0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 200, 0.15) 1px, transparent 1px)
      `,
      backgroundSize: '50px 50px',
    }}
  />
);
```

**Step 3: Create index export**

Create `remotion/src/components/layout/index.ts`:
```typescript
export * from './Background';
export * from './Grid';
```

**Step 4: Commit**

```bash
git add remotion/src/components/layout/
git commit -m "feat: add layout components"
```

---

### Task 5: Create Oscilloscope Effects

**Files:**
- Create: `remotion/src/components/effects/ScanLine.tsx`
- Create: `remotion/src/components/effects/CursorGlow.tsx`
- Create: `remotion/src/components/effects/index.ts`

**Step 1: Create ScanLine effect**

Create `remotion/src/components/effects/ScanLine.tsx`:
```tsx
import React from 'react';
import {useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate} from 'remotion';

export const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();

  const y = interpolate(
    frame % 240, // Loop every 8 seconds at 30fps
    [0, 240],
    [-10, height + 10]
  );

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: y,
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 200, 0.3), transparent)',
        }}
      />
    </AbsoluteFill>
  );
};
```

**Step 2: Create CursorGlow effect**

Create `remotion/src/components/effects/CursorGlow.tsx`:
```tsx
import React from 'react';
import {useCurrentFrame, AbsoluteFill, interpolate} from 'remotion';

interface CursorGlowProps {
  path: Array<{x: number; y: number; frame: number}>;
}

export const CursorGlow: React.FC<CursorGlowProps> = ({path}) => {
  const frame = useCurrentFrame();

  // Find current position based on frame
  let x = 0, y = 0;
  for (let i = 0; i < path.length - 1; i++) {
    if (frame >= path[i].frame && frame < path[i + 1].frame) {
      const progress = interpolate(frame, [path[i].frame, path[i + 1].frame], [0, 1]);
      x = interpolate(progress, [0, 1], [path[i].x, path[i + 1].x]);
      y = interpolate(progress, [0, 1], [path[i].y, path[i + 1].y]);
      break;
    }
  }

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 255, 200, 0.4) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </AbsoluteFill>
  );
};
```

**Step 3: Create index export**

Create `remotion/src/components/effects/index.ts`:
```typescript
export * from './ScanLine';
export * from './CursorGlow';
```

**Step 4: Commit**

```bash
git add remotion/src/components/effects/
git commit -m "feat: add oscilloscope effects"
```

---

## Phase 3: UI Mock Components

### Task 6: Create Button Component

**Files:**
- Create: `remotion/src/components/ui/Button.tsx`

**Step 1: Create Button**

Create `remotion/src/components/ui/Button.tsx`:
```tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    border: 'none',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#00ffc8',
      color: '#0a0f14',
    },
    secondary: {
      backgroundColor: 'rgba(0, 255, 200, 0.1)',
      color: '#00ffc8',
      border: '1px solid rgba(0, 255, 200, 0.3)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#00ffc8',
      border: '1px solid rgba(0, 255, 200, 0.3)',
    },
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 14 },
    lg: { padding: '12px 24px', fontSize: 16 },
  };

  return (
    <button style={{...baseStyle, ...variants[variant], ...sizes[size]}}>
      {children}
    </button>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/components/ui/Button.tsx
git commit -m "feat: add Button component"
```

---

### Task 7: Create Card Component

**Files:**
- Create: `remotion/src/components/ui/Card.tsx`

**Step 1: Create Card**

Create `remotion/src/components/ui/Card.tsx`:
```tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  width,
  height,
}) => {
  return (
    <div
      style={{
        width,
        height,
        background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.9), rgba(15, 30, 45, 0.8))',
        borderRadius: 12,
        border: '1px solid rgba(0, 255, 200, 0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top glow line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 200, 0.5), transparent)',
        }}
      />
      {children}
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/components/ui/Card.tsx
git commit -m "feat: add Card component"
```

---

### Task 8: Create UI Index

**Files:**
- Create: `remotion/src/components/ui/index.ts`

**Step 1: Create UI index**

Create `remotion/src/components/ui/index.ts`:
```typescript
export * from './Button';
export * from './Card';
```

**Step 2: Commit**

```bash
git add remotion/src/components/ui/index.ts
git commit -m "feat: add UI components index"
```

---

## Phase 4: Scene Components

### Task 9: Create Intro Scene

**Files:**
- Create: `remotion/src/scenes/Intro.tsx`

**Step 1: Create Intro scene**

Create `remotion/src/scenes/Intro.tsx`:
```tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {Background, Grid} from '../components/layout';
import {ScanLine} from '../components/effects';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Logo animation
  const logoScale = spring({frame, fps, from: 0, to: 1, durationInFrames: 30});
  const logoOpacity = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'});

  // Tagline animation (appears after logo)
  const taglineOpacity = interpolate(frame, [60, 90], [0, 1], {extrapolateRight: 'clamp'});
  const taglineY = interpolate(frame, [60, 90], [20, 0], {extrapolateRight: 'clamp'});

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center'}}>
          {/* Logo */}
          <div
            style={{
              transform: `scale(${logoScale})`,
              opacity: logoOpacity,
            }}
          >
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 72,
                fontWeight: 700,
                color: '#fff',
                margin: 0,
              }}
            >
              LabVIEW
              <span style={{color: '#00ffc8', textShadow: '0 0 30px rgba(0, 255, 200, 0.5)'}}>
                {' '}Report Builder
              </span>
            </h1>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 24,
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
            }}
          >
            Test Reports That Design Themselves
          </p>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/scenes/Intro.tsx
git commit -m "feat: add Intro scene"
```

---

### Task 10: Create Homepage Scene

**Files:**
- Create: `remotion/src/scenes/Homepage.tsx`

**Step 1: Create Homepage scene with waveform**

Create `remotion/src/scenes/Homepage.tsx`:
```tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Sequence} from 'remotion';
import {Background, Grid} from '../components/layout';
import {ScanLine} from '../components/effects';
import {Button} from '../components/ui';

const Waveform: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = (frame * 2) % 80;

  return (
    <svg width={400} height={150} viewBox="0 0 400 150">
      <defs>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00ffc8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#00ffc8" stopOpacity="1" />
          <stop offset="100%" stopColor="#00ffc8" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <path
        d={`M ${-offset},75 ${generateWavePath(500)}`}
        fill="none"
        stroke="url(#glow)"
        strokeWidth={2}
        style={{filter: 'drop-shadow(0 0 8px rgba(0, 255, 200, 0.8))'}}
      />
    </svg>
  );
};

function generateWavePath(width: number): string {
  let path = '';
  for (let x = 0; x < width; x += 10) {
    const y = 75 + Math.sin(x * 0.05) * 30 + Math.sin(x * 0.02) * 20;
    path += `L ${x},${y} `;
  }
  return path;
}

export const Homepage: React.FC = () => {
  const frame = useCurrentFrame();

  const heroOpacity = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'});
  const featuresOpacity = interpolate(frame, [60, 90], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{padding: 60}}>
        {/* Hero section */}
        <div style={{opacity: heroOpacity, display: 'flex', gap: 60}}>
          {/* Left: Text */}
          <div style={{flex: 1}}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 48,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 24,
            }}>
              Test Reports That{' '}
              <span style={{color: '#00ffc8', textShadow: '0 0 20px rgba(0, 255, 200, 0.5)'}}>
                Design Themselves
              </span>
            </h1>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 32,
            }}>
              Design report templates visually. Export self-contained HTML files.
            </p>
            <Button variant="primary" size="lg">START BUILDING FREE</Button>
          </div>

          {/* Right: Oscilloscope display */}
          <div style={{
            width: 450,
            background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.95), rgba(5, 8, 16, 0.95))',
            borderRadius: 12,
            border: '2px solid rgba(0, 255, 200, 0.2)',
            padding: 20,
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16}}>
              <div style={{width: 8, height: 8, borderRadius: '50%', background: '#39ff14'}} />
              <span style={{fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(0, 255, 200, 0.5)'}}>
                SIGNAL
              </span>
            </div>
            <div style={{
              background: '#050810',
              borderRadius: 8,
              border: '1px solid rgba(0, 255, 200, 0.1)',
              padding: 16,
            }}>
              <Waveform />
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div style={{
          opacity: featuresOpacity,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginTop: 60,
        }}>
          {['Visual Builder', 'HTML Export', 'Any Language'].map((feature, i) => (
            <div key={i} style={{
              background: 'rgba(0, 255, 200, 0.05)',
              border: '1px solid rgba(0, 255, 200, 0.1)',
              borderRadius: 8,
              padding: 16,
            }}>
              <span style={{fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#00ffc8'}}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/scenes/Homepage.tsx
git commit -m "feat: add Homepage scene with waveform"
```

---

### Task 11: Create Signup Scene

**Files:**
- Create: `remotion/src/scenes/Signup.tsx`

**Step 1: Create Signup scene**

Create `remotion/src/scenes/Signup.tsx`:
```tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {Background, Grid} from '../components/layout';
import {ScanLine} from '../components/effects';
import {Button, Card} from '../components/ui';

export const Signup: React.FC = () => {
  const frame = useCurrentFrame();

  const cardOpacity = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'});

  // Typewriter effect for email
  const emailText = 'engineer@example.com';
  const visibleChars = Math.min(Math.floor(frame / 3), emailText.length);
  const displayedEmail = emailText.slice(0, visibleChars);

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <Card width={400} height={350}>
          <div style={{padding: 32}}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24,
              fontWeight: 600,
              color: '#fff',
              marginBottom: 8,
            }}>
              Create Account
            </h2>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: 32,
            }}>
              Start building reports in seconds
            </p>

            {/* Email input */}
            <div style={{marginBottom: 16}}>
              <label style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'rgba(0, 255, 200, 0.6)',
                marginBottom: 8,
              }}>
                EMAIL
              </label>
              <div style={{
                background: '#050810',
                border: '1px solid rgba(0, 255, 200, 0.2)',
                borderRadius: 8,
                padding: 12,
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: '#fff',
                }}>
                  {displayedEmail}
                  {visibleChars < emailText.length && (
                    <span style={{opacity: 0.5, animation: 'blink 1s infinite'}}>|</span>
                  )}
                </span>
              </div>
            </div>

            {/* Password input */}
            <div style={{marginBottom: 24}}>
              <label style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'rgba(0, 255, 200, 0.6)',
                marginBottom: 8,
              }}>
                PASSWORD
              </label>
              <div style={{
                background: '#050810',
                border: '1px solid rgba(0, 255, 200, 0.2)',
                borderRadius: 8,
                padding: 12,
              }}>
                <span style={{color: '#39ff14'}}>••••••••</span>
              </div>
            </div>

            <Button variant="primary" size="lg">CREATE ACCOUNT</Button>
          </div>
        </Card>
      </AbsoluteFill>
    </Background>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/scenes/Signup.tsx
git commit -m "feat: add Signup scene with typewriter effect"
```

---

### Task 12: Create Dashboard Scene

**Files:**
- Create: `remotion/src/scenes/Dashboard.tsx`

**Step 1: Create Dashboard scene**

Create `remotion/src/scenes/Dashboard.tsx`:
```tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {Background, Grid} from '../components/layout';
import {ScanLine} from '../components/effects';
import {Card} from '../components/ui';

const TemplateCard: React.FC<{index: number; delay: number}> = ({index, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 20,
  });
  const opacity = interpolate(frame - delay, [0, 20], [0, 1], {extrapolateRight: 'clamp'});

  const templates = [
    {name: 'Test Report v1', date: '2 days ago'},
    {name: 'QC Summary', date: '1 week ago'},
    {name: 'Production Log', date: '2 weeks ago'},
  ];

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      width: 200,
      height: 160,
      background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.9), rgba(15, 30, 45, 0.8))',
      borderRadius: 12,
      border: '1px solid rgba(0, 255, 200, 0.15)',
      padding: 16,
    }}>
      {/* Preview placeholder */}
      <div style={{
        height: 80,
        background: '#050810',
        borderRadius: 8,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{width: 40, height: 40, borderRadius: 4, background: 'rgba(0, 255, 200, 0.1)'}} />
      </div>
      <div style={{fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#fff'}}>
        {templates[index].name}
      </div>
      <div style={{fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255, 255, 255, 0.4)'}}>
        {templates[index].date}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{padding: 40}}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          opacity: headerOpacity,
        }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            fontWeight: 600,
            color: '#fff',
          }}>
            Dashboard
          </h1>
          <div style={{
            background: '#00ffc8',
            color: '#0a0f14',
            padding: '8px 16px',
            borderRadius: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 600,
          }}>
            + New Template
          </div>
        </div>

        {/* Stats */}
        <div style={{display: 'flex', gap: 24, marginBottom: 32}}>
          {['Total Templates: 3', 'Downloads: 47', 'Plan: Free'].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(0, 255, 200, 0.05)',
              border: '1px solid rgba(0, 255, 200, 0.1)',
              borderRadius: 8,
              padding: 16,
              opacity: interpolate(frame, [20 + i * 10, 40 + i * 10], [0, 1], {extrapolateRight: 'clamp'}),
            }}>
              <span style={{fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255, 255, 255, 0.6)'}}>
                {stat}
              </span>
            </div>
          ))}
        </div>

        {/* Template grid */}
        <div style={{display: 'flex', gap: 24}}>
          {[0, 1, 2].map((i) => (
            <TemplateCard key={i} index={i} delay={60 + i * 15} />
          ))}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/scenes/Dashboard.tsx
git commit -m "feat: add Dashboard scene"
```

---

### Task 13: Create Builder Scene

**Files:**
- Create: `remotion/src/scenes/Builder.tsx`

**Step 1: Create Builder scene (main demo)**

Create `remotion/src/scenes/Builder.tsx`:
```tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Sequence} from 'remotion';
import {Background, Grid} from '../components/layout';
import {ScanLine, CursorGlow} from '../components/effects';

// Component items in toolbox
const Toolbox: React.FC<{visible: boolean}> = ({visible}) => (
  <div style={{
    width: 200,
    background: 'rgba(10, 20, 30, 0.95)',
    borderRight: '1px solid rgba(0, 255, 200, 0.15)',
    padding: 16,
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.3s',
  }}>
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: 'rgba(0, 255, 200, 0.6)',
      marginBottom: 16,
    }}>
      COMPONENTS
    </div>
    {['Text', 'Chart', 'Table', 'Gauge', 'Indicator'].map((comp, i) => (
      <div key={i} style={{
        background: 'rgba(0, 255, 200, 0.05)',
        border: '1px solid rgba(0, 255, 200, 0.1)',
        borderRadius: 6,
        padding: 8,
        marginBottom: 8,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#fff',
      }}>
        {comp}
      </div>
    ))}
  </div>
);

// Canvas area with components
const Canvas: React.FC<{showDrop: boolean; droppedComponent: string | null}> = ({showDrop, droppedComponent}) => {
  const frame = useCurrentFrame();

  return (
    <div style={{
      flex: 1,
      background: 'rgba(5, 8, 16, 0.9)',
      padding: 24,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    }}>
      {/* Paper preview */}
      <div style={{
        width: 400,
        height: 500,
        background: '#fff',
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        padding: 20,
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#0a0f14',
          marginBottom: 16,
          opacity: interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          Test Report - {{date: new Date().toLocaleDateString()}}
        </div>

        {/* Existing component */}
        <div style={{
          height: 40,
          background: 'rgba(0, 255, 200, 0.1)',
          border: '1px dashed rgba(0, 255, 200, 0.3)',
          borderRadius: 4,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#0a0f14',
        }}>
          Overall Status: PASS
        </div>

        {/* Drop zone highlight */}
        {showDrop && (
          <div style={{
            height: 80,
            border: '2px dashed #00ffc8',
            borderRadius: 4,
            background: 'rgba(0, 255, 200, 0.05)',
            marginBottom: 12,
          }} />
        )}

        {/* Dropped component */}
        {droppedComponent && (
          <div style={{
            height: 80,
            background: 'rgba(0, 255, 200, 0.15)',
            border: '1px solid rgba(0, 255, 200, 0.3)',
            borderRadius: 4,
            marginBottom: 12,
            padding: 8,
            opacity: interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'}),
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#39ff14',
              marginBottom: 4,
            }}>
              {droppedComponent.toUpperCase()}
            </div>
            <div style={{height: 50, background: 'rgba(0, 0, 0, 0.1)', borderRadius: 4}} />
          </div>
        )}
      </div>
    </div>
  );
};

// Properties panel
const PropertiesPanel: React.FC<{visible: boolean}> = ({visible}) => (
  <div style={{
    width: 220,
    background: 'rgba(10, 20, 30, 0.95)',
    borderLeft: '1px solid rgba(0, 255, 200, 0.15)',
    padding: 16,
    opacity: visible ? 1 : 0,
  }}>
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: 'rgba(0, 255, 200, 0.6)',
      marginBottom: 16,
    }}>
      PROPERTIES
    </div>
    <div style={{marginBottom: 12}}>
      <label style={{
        display: 'block',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: 4,
      }}>
        WIDTH
      </label>
      <div style={{
        background: '#050810',
        border: '1px solid rgba(0, 255, 200, 0.2)',
        borderRadius: 4,
        padding: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#fff',
      }}>
        100%
      </div>
    </div>
    <div style={{marginBottom: 12}}>
      <label style={{
        display: 'block',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: 4,
      }}>
        DATA BINDING
      </label>
      <div style={{
        background: '#050810',
        border: '1px solid rgba(0, 255, 200, 0.2)',
        borderRadius: 4,
        padding: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#00ffc8',
      }}>
        {'{{data.testResults}}'}
      </div>
    </div>
  </div>
);

export const Builder: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase 1: Show builder layout (0-150)
  // Phase 2: Drag-drop animation (150-300)
  // Phase 3: Show properties (300-450)

  const showToolbox = frame > 30;
  const showDrop = frame > 150 && frame < 280;
  const showProperties = frame > 200;
  const droppedComponent = frame > 280 ? 'Chart' : null;

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{flexDirection: 'column'}}>
        {/* Top bar */}
        <div style={{
          height: 48,
          background: 'rgba(10, 20, 30, 0.95)',
          borderBottom: '1px solid rgba(0, 255, 200, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: '#fff',
          }}>
            Test Report v1
          </div>
          <div style={{
            background: '#00ffc8',
            color: '#0a0f14',
            padding: '6px 12px',
            borderRadius: 6,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
          }}>
            Export
          </div>
        </div>

        {/* Main content */}
        <div style={{flex: 1, display: 'flex'}}>
          <Toolbox visible={showToolbox} />
          <Canvas showDrop={showDrop} droppedComponent={droppedComponent} />
          <PropertiesPanel visible={showProperties} />
        </div>
      </AbsoluteFill>
    </Background>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/scenes/Builder.tsx
git commit -m "feat: add Builder scene with drag-drop demo"
```

---

### Task 14: Create Export Scene

**Files:**
- Create: `remotion/src/scenes/Export.tsx`

**Step 1: Create Export scene**

Create `remotion/src/scenes/Export.tsx`:
```tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {Background, Grid} from '../components/layout';
import {ScanLine} from '../components/effects';
import {Button, Card} from '../components/ui';

export const Export: React.FC = () => {
  const frame = useCurrentFrame();

  const modalOpacity = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  const progressWidth = interpolate(frame, [60, 120], [0, 100], {extrapolateRight: 'clamp'});
  const showComplete = frame > 130;

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      {/* Dimmed background */}
      <AbsoluteFill style={{background: 'rgba(0, 0, 0, 0.5)'}} />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{
          opacity: modalOpacity,
          width: 400,
          background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.98), rgba(15, 30, 45, 0.98))',
          borderRadius: 16,
          border: '1px solid rgba(0, 255, 200, 0.2)',
          padding: 32,
        }}>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 24,
            fontWeight: 600,
            color: '#fff',
            marginBottom: 24,
          }}>
            Export Report
          </h2>

          {!showComplete ? (
            <>
              {/* Progress bar */}
              <div style={{
                height: 8,
                background: 'rgba(0, 255, 200, 0.1)',
                borderRadius: 4,
                marginBottom: 16,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progressWidth}%`,
                  height: '100%',
                  background: '#00ffc8',
                  borderRadius: 4,
                }} />
              </div>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
              }}>
                Generating HTML...
              </p>
            </>
          ) : (
            <>
              {/* Complete state */}
              <div style={{
                textAlign: 'center',
                marginBottom: 24,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(57, 255, 20, 0.1)',
                  border: '2px solid #39ff14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <span style={{color: '#39ff14', fontSize: 24}}>✓</span>
                </div>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: '#fff',
                }}>
                  Export Complete!
                </p>
              </div>
              <div style={{textAlign: 'center'}}>
                <Button variant="primary" size="lg">Download HTML</Button>
              </div>
            </>
          )}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/scenes/Export.tsx
git commit -m "feat: add Export scene with progress animation"
```

---

### Task 15: Create Outro Scene

**Files:**
- Create: `remotion/src/scenes/Outro.tsx`

**Step 1: Create Outro scene**

Create `remotion/src/scenes/Outro.tsx`:
```tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {Background, Grid} from '../components/layout';
import {ScanLine} from '../components/effects';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const ctaScale = spring({frame, fps, from: 0.8, to: 1, durationInFrames: 30});
  const ctaOpacity = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'});
  const urlOpacity = interpolate(frame, [60, 90], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center'}}>
          {/* CTA */}
          <div style={{opacity: ctaOpacity, transform: `scale(${ctaScale})`}}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 48,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 16,
            }}>
              Start Building{' '}
              <span style={{color: '#00ffc8', textShadow: '0 0 30px rgba(0, 255, 200, 0.5)'}}>
                Today
              </span>
            </h1>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.6)',
            }}>
              Free to start. No credit card required.
            </p>
          </div>

          {/* URL */}
          <div style={{
            marginTop: 48,
            opacity: urlOpacity,
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 24,
              color: '#00ffc8',
              textShadow: '0 0 20px rgba(0, 255, 200, 0.3)',
            }}>
              labview-report-builder.com
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/scenes/Outro.tsx
git commit -m "feat: add Outro scene"
```

---

### Task 16: Create Scenes Index

**Files:**
- Create: `remotion/src/scenes/index.ts`

**Step 1: Create scenes index**

Create `remotion/src/scenes/index.ts`:
```typescript
export * from './Intro';
export * from './Homepage';
export * from './Signup';
export * from './Dashboard';
export * from './Builder';
export * from './Export';
export * from './Outro';
```

**Step 2: Commit**

```bash
git add remotion/src/scenes/index.ts
git commit -m "feat: add scenes index"
```

---

## Phase 5: Main Video Composition

### Task 17: Create Main Video Timeline

**Files:**
- Create: `remotion/src/Video.tsx`

**Step 1: Create main video composition**

Create `remotion/src/Video.tsx`:
```tsx
import React from 'react';
import {Sequence} from 'remotion';
import {
  Intro,
  Homepage,
  Signup,
  Dashboard,
  Builder,
  Export,
  Outro,
} from './scenes';
import {theme} from './config/theme';

const {timing} = theme;

export const Video: React.FC = () => {
  return (
    <>
      <Sequence from={timing.intro.start} durationInFrames={timing.intro.duration}>
        <Intro />
      </Sequence>

      <Sequence from={timing.homepage.start} durationInFrames={timing.homepage.duration}>
        <Homepage />
      </Sequence>

      <Sequence from={timing.signup.start} durationInFrames={timing.signup.duration}>
        <Signup />
      </Sequence>

      <Sequence from={timing.dashboard.start} durationInFrames={timing.dashboard.duration}>
        <Dashboard />
      </Sequence>

      <Sequence from={timing.builder.start} durationInFrames={timing.builder.duration}>
        <Builder />
      </Sequence>

      <Sequence from={timing.export.start} durationInFrames={timing.export.duration}>
        <Export />
      </Sequence>

      <Sequence from={timing.outro.start} durationInFrames={timing.outro.duration}>
        <Outro />
      </Sequence>
    </>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/Video.tsx
git commit -m "feat: add main video timeline"
```

---

### Task 18: Configure Root with Compositions

**Files:**
- Modify: `remotion/src/Root.tsx`

**Step 1: Update Root.tsx with all compositions**

Replace `remotion/src/Root.tsx`:
```tsx
import {Composition} from 'remotion';
import {loadFont} from '@remotion/google-fonts';
import {Video} from './Video';
import {theme} from './config/theme';

// Load fonts
loadFont('SpaceGrotesk', {weights: ['400', '500', '600', '700']});
loadFont('JetBrainsMono', {weights: ['400', '500']});

const totalDuration = theme.timing.outro.start + theme.timing.outro.duration;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 16:9 - Main composition */}
      <Composition
        id="LabVIEWDemo-16x9"
        component={Video}
        durationInFrames={totalDuration}
        fps={theme.timing.fps}
        width={1920}
        height={1080}
      />

      {/* 9:16 - Stories/Reels */}
      <Composition
        id="LabVIEWDemo-9x16"
        component={Video}
        durationInFrames={totalDuration}
        fps={theme.timing.fps}
        width={1080}
        height={1920}
      />

      {/* 1:1 - Social feed */}
      <Composition
        id="LabVIEWDemo-1x1"
        component={Video}
        durationInFrames={totalDuration}
        fps={theme.timing.fps}
        width={1080}
        height={1080}
      />
    </>
  );
};
```

**Step 2: Commit**

```bash
git add remotion/src/Root.tsx
git commit -m "feat: configure compositions for all aspect ratios"
```

---

## Phase 6: Testing & Rendering

### Task 19: Test Preview in Remotion Studio

**Step 1: Start Remotion Studio**

```bash
cd remotion
npm run dev
```

**Step 2: Verify in browser**

Open `http://localhost:3000` and verify:
- All scenes render correctly
- Transitions are smooth
- Timings match the design

**Step 3: Fix any issues found**

Document any fixes needed and implement them.

---

### Task 20: Render Final Videos

**Step 1: Render 16:9 version**

```bash
cd remotion
npx remotion render LabVIEWDemo-16x9 out/labview-demo-16x9.mp4
```

**Step 2: Render 9:16 version**

```bash
npx remotion render LabVIEWDemo-9x16 out/labview-demo-9x16.mp4
```

**Step 3: Render 1:1 version**

```bash
npx remotion render LabVIEWDemo-1x1 out/labview-demo-1x1.mp4
```

**Step 4: Commit final renders**

```bash
git add remotion/out/
git commit -m "feat: render final video outputs"
```

---

## Task Summary

| # | Task | Files | Est. Complexity |
|---|------|-------|-----------------|
| 1 | Initialize Remotion | `remotion/` | Low |
| 2 | Configure Theme | `config/theme.ts`, `tailwind.config.js` | Low |
| 3 | Add Fonts | `Root.tsx` | Low |
| 4 | Layout Components | `components/layout/` | Low |
| 5 | Effects Components | `components/effects/` | Medium |
| 6 | Button Component | `components/ui/Button.tsx` | Low |
| 7 | Card Component | `components/ui/Card.tsx` | Low |
| 8 | UI Index | `components/ui/index.ts` | Low |
| 9 | Intro Scene | `scenes/Intro.tsx` | Medium |
| 10 | Homepage Scene | `scenes/Homepage.tsx` | High |
| 11 | Signup Scene | `scenes/Signup.tsx` | Medium |
| 12 | Dashboard Scene | `scenes/Dashboard.tsx` | Medium |
| 13 | Builder Scene | `scenes/Builder.tsx` | High |
| 14 | Export Scene | `scenes/Export.tsx` | Medium |
| 15 | Outro Scene | `scenes/Outro.tsx` | Low |
| 16 | Scenes Index | `scenes/index.ts` | Low |
| 17 | Video Timeline | `Video.tsx` | Low |
| 18 | Root Compositions | `Root.tsx` | Low |
| 19 | Test Preview | - | Medium |
| 20 | Render Videos | `out/` | Low |

**Total: 20 tasks across 6 phases**
