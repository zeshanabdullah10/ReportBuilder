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

export type Theme = typeof theme;
