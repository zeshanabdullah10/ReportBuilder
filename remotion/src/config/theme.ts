export const theme = {
  colors: {
    phosphor: {
      cyan: '#00ffc8',
      green: '#39ff14',
      amber: '#ffb000',
      red: '#ff4444',
    },
    oscilloscope: {
      bg: '#0a0f14',
      bgDark: '#050810',
      grid: 'rgba(0, 255, 200, 0.08)',
      border: 'rgba(0, 255, 200, 0.15)',
    },
    report: {
      paper: '#ffffff',
      text: '#1a1a1a',
      muted: '#666666',
      border: '#e0e0e0',
    },
    languages: {
      python: '#3776AB',
      csharp: '#512BD4',
      matlab: '#E16737',
      json: '#00ffc8',
    },
  },
  fonts: {
    heading: "'Space Grotesk', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  // 45 second video (1350 frames at 30fps)
  timing: {
    fps: 30,
    // Scene timings - streamlined flow
    intro: { start: 0, duration: 180 },           // 0:00-0:06 (6s) - Marketing intro
    builder: { start: 180, duration: 540 },       // 0:06-0:24 (18s) - Complete builder demo
    preview: { start: 720, duration: 180 },       // 0:24-0:30 (6s) - Preview with data
    export: { start: 900, duration: 150 },        // 0:30-0:35 (5s) - Export modal
    output: { start: 1050, duration: 120 },       // 0:35-0:39 (4s) - Final output
    outro: { start: 1170, duration: 180 },        // 0:39-0:45 (6s) - CTA
  },
} as const;

export type Theme = typeof theme;
