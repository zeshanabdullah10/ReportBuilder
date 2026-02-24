import React from 'react';
import { useCurrentFrame, AbsoluteFill, interpolate } from 'remotion';

interface CursorGlowProps {
  path: Array<{ x: number; y: number; frame: number }>;
}

export const CursorGlow: React.FC<CursorGlowProps> = ({ path }) => {
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
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
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
