import React from 'react';
import { AbsoluteFill } from 'remotion';

export const Grid: React.FC<{ opacity?: number }> = ({ opacity = 0.1 }) => (
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
