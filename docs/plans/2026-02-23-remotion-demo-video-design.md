# Remotion Demo Video Design

**Date:** 2026-02-23
**Status:** Approved
**Target Completion:** TBD

## Overview

A 2-3 minute marketing video showcasing the full LabVIEW Report Builder product journey, recreated entirely in Remotion using React components. The video blends smooth screen-recording-style interactions with the oscilloscope precision theme for a distinctive technical aesthetic.

## Target Outputs

| Format | Resolution | Usage |
|--------|------------|-------|
| 16:9 | 1920x1080 | Landing page, YouTube |
| 9:16 | 1080x1920 | Social stories/reels |
| 1:1 | 1080x1080 | Social feed posts |

## Video Structure (2:30 runtime)

| Section | Duration | Content |
|---------|----------|---------|
| **Intro** | 0:00-0:15 | Animated logo + tagline with oscilloscope grid |
| **Homepage** | 0:15-0:45 | Hero section with animated waveform, features grid, pricing preview |
| **Sign-up Flow** | 0:45-1:00 | Quick signup animation, transition to dashboard |
| **Dashboard** | 1:00-1:20 | Template grid, stats cards, "New Template" click |
| **Builder Deep Dive** | 1:20-2:10 | Toolbox reveal, drag-drop demo, component showcase, preview mode |
| **Export** | 2:10-2:20 | Export modal, download animation |
| **Outro** | 2:20-2:30 | CTA with animated URL |

## Visual Design

### Oscilloscope Enhancements

- **Scan line overlay** - Subtle horizontal sweep across the video periodically
- **Grid background** - Animated grid with pulse glow at intersections
- **Cursor highlight** - Glowing cyan circle following mouse movements
- **Data flow particles** - Small cyan dots flowing along connection lines
- **Transition effects** - "Signal fade" wipes between sections (like an oscilloscope trace)

### Color Palette

```
Primary:    #00ffc8 (Phosphor Cyan)
Accent:     #39ff14 (Phosphor Green)
Warning:    #ffb000 (Phosphor Amber)
Background: #0a0f14 (Grid Dark)
Input:      #050810 (Input Dark)
```

### Typography

- **Space Grotesk** - Headings (modern, geometric)
- **JetBrains Mono** - Labels/code (technical feel)
- Text glow effects on highlights

### Animation Style

- Smooth ease-out curves for camera movements
- Spring physics for drag-drop interactions
- Staggered reveals for lists/grids
- Typewriter effect for form inputs

## Technical Architecture

### Project Structure

```
remotion/
├── src/
│   ├── Root.tsx              # Composition definitions (3 aspect ratios)
│   ├── Video.tsx             # Main video timeline
│   ├── scenes/
│   │   ├── Intro.tsx         # Logo + tagline
│   │   ├── Homepage.tsx      # Hero, features, pricing
│   │   ├── Signup.tsx        # Auth flow
│   │   ├── Dashboard.tsx     # Template grid
│   │   ├── Builder.tsx       # Main builder demo
│   │   ├── Export.tsx        # Export modal
│   │   └── Outro.tsx         # CTA
│   ├── components/
│   │   ├── ui/               # Recreated UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ...
│   │   ├── builder/          # Builder components
│   │   │   ├── Canvas.tsx
│   │   │   ├── Toolbox.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── ...
│   │   └── effects/          # Oscilloscope effects
│   │       ├── ScanLines.tsx
│   │       ├── GridBackground.tsx
│   │       ├── CursorGlow.tsx
│   │       └── DataParticles.tsx
│   └── config/
│       └── theme.ts          # Colors, fonts, timing constants
├── public/
│   └── audio/                # Background music
└── package.json
```

### Key Technical Decisions

- **Standalone project** - Separate from main Next.js app for clean separation
- **Shared theme** - Copy theme constants from main app (keeps Remotion independent)
- **Multiple compositions** - One for each aspect ratio (16:9, 9:16, 1:1)
- **External audio** - Music track added as asset

## Deliverables

### Video Files

- `labview-demo-16x9.mp4` (1920x1080, H.264)
- `labview-demo-9x16.mp4` (1080x1920, for stories/reels)
- `labview-demo-1x1.mp4` (1080x1080, for social feeds)
- Web-optimized versions (smaller file sizes)

### Source Files

- Full Remotion project in `remotion/` directory
- All React components (editable for future updates)
- Render scripts for easy re-rendering
- README with modification instructions

### Render Settings

- **Frame rate:** 30fps
- **Codec:** H.264
- **Target size:** ~10-15MB for 16:9 web version

## Summary

| Aspect | Decision |
|--------|----------|
| Purpose | Marketing demo |
| Scope | Full journey (homepage → builder → export) |
| Length | ~2:30 minutes |
| Style | Screen recording + oscilloscope effects |
| Content | UI recreated in Remotion |
| Audio | Music only |
| Formats | 16:9, 9:16, 1:1 |
| Location | Standalone `remotion/` project |
