# Remotion Marketing Video Plan - LabVIEW Report Builder

## Overview

Create a comprehensive marketing/demo video using Remotion that showcases the complete Report Builder workflow, from creating a report to exporting it. The video will use actual UI components matching the real application.

## Video Specifications

- **Duration**: 60 seconds (1800 frames at 30fps)
- **Resolution**: 1920x1080 (16:9 primary)
- **Style**: Oscilloscope/phosphor theme matching existing Remotion setup
- **Data Source**: `sample-data/component-test-sample.json`

## Scene Breakdown

### Scene 1: Intro (0:00-0:08) - 240 frames
**Purpose**: Hook viewers with marketing elements

**Visual Elements**:
- LabVIEW Report Builder logo animation
- Tagline: "Professional Test Reports in Minutes"
- Animated background with grid and phosphor glow effects
- Brief feature highlights floating in:
  - "Drag & Drop Builder"
  - "LabVIEW Integration"
  - "One-Click Export"

**Animations**:
- Logo fades in with glow effect
- Feature pills slide in from sides
- Subtle scan line effect

---

### Scene 2: Builder Overview (0:08-0:15) - 210 frames
**Purpose**: Show the builder interface

**Visual Elements**:
- Full builder interface appears:
  - Left: Toolbox with component categories
  - Center: Canvas with white paper
  - Right: Properties panel (hidden initially)
- Top toolbar with actions

**Animations**:
- Interface fades/scales in
- Toolbox categories highlight sequentially
- Canvas paper drops in with shadow

---

### Scene 3: Component Drop - Header (0:15-0:22) - 210 frames
**Purpose**: Show dropping Header component

**Visual Elements**:
- Cursor moves to Toolbox
- Highlights "Text" component (for header)
- Drags to canvas top area
- Drop zone appears
- Component snaps into place
- Properties panel slides in

**Data Binding Shown**:
```
{{data.meta.reportTitle}}
```

**Animations**:
- Cursor movement with glow trail
- Component highlight pulse
- Smooth drag animation
- Drop zone glow
- Component settle effect

---

### Scene 4: Component Drop - Chart (0:22-0:30) - 240 frames
**Purpose**: Show dropping and configuring Chart component

**Visual Elements**:
- Cursor selects "Chart" from toolbox
- Drags below header
- Chart appears with sample bars
- Properties panel shows data binding

**Data Binding Shown**:
```
{{data.chartData.labels}}
{{data.chartData.values}}
```

**Chart Data** (from sample):
- Labels: Test 1-8
- Values: [95, 87, 92, 78, 91, 88, 94, 85]

**Animations**:
- Chart bars animate in sequentially
- Zoom transition to chart area
- Data binding text types in

---

### Scene 5: Component Drop - Pass/Fail Indicator (0:30-0:37) - 210 frames
**Purpose**: Show status indicator component

**Visual Elements**:
- Cursor selects "Indicator" from toolbox
- Places next to/below chart
- Shows PASS status with green glow
- Properties panel shows binding

**Data Binding Shown**:
```
{{data.status.overall}}
```

**Sample Data**:
- Overall Status: "pass"
- Shows green checkmark with "PASS" text

**Animations**:
- Indicator pulses green
- Status text fades in
- Glow effect on pass state

---

### Scene 6: Component Drop - Test Summary (0:37-0:44) - 210 frames
**Purpose**: Show TestSummaryBox component

**Visual Elements**:
- Cursor selects "Test Summary" from toolbox
- Places in center area
- Summary box shows:
  - Total Tests: 200
  - Passed: 142
  - Failed: 5
  - Skipped: 3
  - Pass Rate: 94.67%

**Data Binding Shown**:
```
{{data.summary.totalTests}}
{{data.summary.passed}}
{{data.summary.failed}}
{{data.summary.passRate}}
```

**Animations**:
- Numbers count up animation
- Each stat animates in sequence
- Pass rate circle fills

---

### Scene 7: Component Drop - Signoff (0:44-0:50) - 180 frames
**Purpose**: Show SignatureLine component for approval

**Visual Elements**:
- Cursor selects "Signature Line" from toolbox
- Places at bottom of report
- Shows:
  - "Tested By: John Smith"
  - "Date: 2026-02-24"
  - Signature line
  - "Approved By: _____________"

**Data Binding Shown**:
```
{{data.approval.testedBy}}
{{data.approval.testedDate}}
```

**Animations**:
- Signature line draws itself
- Text fades in above line
- Pending approval area highlights

---

### Scene 8: Preview Mode (0:50-0:55) - 150 frames
**Purpose**: Show the preview with actual data populated

**Visual Elements**:
- Click "Preview" button in toolbar
- Transition to preview mode
- All components now show real data from JSON:
  - Header: "PCB Assembly Test Report"
  - Chart: Animated bars with actual values
  - Indicator: Green PASS badge
  - Summary: Real numbers
  - Signoff: John Smith's info

**Animations**:
- Button click ripple
- Smooth transition to preview
- Data population effect (flash of cyan)
- Zoom out to show full report

---

### Scene 9: Export (0:55-0:58) - 90 frames
**Purpose**: Show export functionality

**Visual Elements**:
- Export modal appears
- Progress bar fills
- Shows completion with checkmark
- Options shown:
  - "Download HTML"
  - "Print (Headless Available)"

**Text Overlay**:
- "Export to standalone HTML"
- "Print-ready with headless mode support"

**Animations**:
- Modal scales in
- Progress bar animates
- Checkmark bounces in
- Button glow effect

---

### Scene 10: Final Output (0:58-1:00) - 60 frames
**Purpose**: Show the exported HTML report

**Visual Elements**:
- Browser window with exported report
- Print dialog preview
- Report looks identical to preview

**Text Overlay**:
- "Standalone HTML - No dependencies"
- "Ready for automated printing"

**Animations**:
- Browser window fades in
- Print dialog slides up
- Final glow effect

---

### Scene 11: Outro (1:00+) - 120 frames
**Purpose**: Call to action

**Visual Elements**:
- Logo reappears
- CTA: "Start Building Reports Today"
- URL/Link display
- Feature recap pills

**Animations**:
- Elements fade/slide in
- Subtle pulse on CTA
- Fade to black

---

## Technical Implementation

### Files to Create/Modify

1. **`remotion/src/config/theme.ts`** - Update timing for 60s video
2. **`remotion/src/Video.tsx`** - Add new scene sequences
3. **`remotion/src/scenes/Intro.tsx`** - Enhance with marketing elements
4. **`remotion/src/scenes/Builder.tsx`** - Complete rewrite for multi-component demo
5. **`remotion/src/scenes/Preview.tsx`** - NEW: Preview mode scene
6. **`remotion/src/scenes/Export.tsx`** - Enhance with print options
7. **`remotion/src/scenes/Outro.tsx`** - Update with CTA

### Component Visuals to Match

Based on actual components in `components/builder/components/`:

| Component | Key Visual Elements |
|-----------|---------------------|
| Text | Clean typography, editable placeholder |
| Chart | Bar/line chart with cyan gradient |
| Indicator | Circular badge, green/amber/red |
| TestSummaryBox | Grid of stats with icons |
| SignatureLine | Line with text above |

### Color Palette

```typescript
colors: {
  phosphor: {
    cyan: '#00ffc8',      // Primary accent
    green: '#39ff14',     // Pass states
    amber: '#ffb000',     // Warning states
  },
  oscilloscope: {
    bg: '#0a0f14',        // Dark background
    bgDark: '#050810',    // Darker panels
    grid: 'rgba(0, 255, 200, 0.08)',
    border: 'rgba(0, 255, 200, 0.15)',
  },
  report: {
    paper: '#ffffff',     // Canvas paper
    text: '#1a1a1a',      // Report text
    muted: '#666666',     // Secondary text
  }
}
```

### Animation Timing (Total: 1800 frames / 60s)

| Scene | Start Frame | Duration | End Frame |
|-------|-------------|----------|-----------|
| Intro | 0 | 240 | 240 |
| Builder Overview | 240 | 210 | 450 |
| Header Drop | 450 | 210 | 660 |
| Chart Drop | 660 | 240 | 900 |
| Indicator Drop | 900 | 210 | 1110 |
| Summary Drop | 1110 | 210 | 1320 |
| Signoff Drop | 1320 | 180 | 1500 |
| Preview | 1500 | 150 | 1650 |
| Export | 1650 | 90 | 1740 |
| Output | 1740 | 60 | 1800 |

---

## Sample Data Usage

From `sample-data/component-test-sample.json`:

```json
{
  "meta": {
    "reportTitle": "PCB Assembly Test Report"
  },
  "summary": {
    "totalTests": 200,
    "passed": 142,
    "failed": 5,
    "passRate": 94.67
  },
  "chartData": {
    "labels": ["Test 1", "Test 2", ...],
    "values": [95, 87, 92, 78, 91, 88, 94, 85]
  },
  "status": {
    "overall": "pass"
  },
  "approval": {
    "testedBy": "John Smith",
    "testedDate": "2026-02-24"
  }
}
```

---

## Next Steps

1. Switch to Code mode to implement
2. Update theme timing configuration
3. Create/enhance scene components
4. Test with `npm run video`
5. Render final video with `npm run video:render`
