import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate } from 'remotion';

export const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  const y = interpolate(
    frame % 240, // Loop every 8 seconds at 30fps
    [0, 240],
    [-10, height + 10]
  );

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
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
