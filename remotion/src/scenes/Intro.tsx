import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 30 });
  const logoOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  // Tagline animation (appears after logo)
  const taglineOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' });
  const taglineY = interpolate(frame, [60, 90], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
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
              <span style={{ color: '#00ffc8', textShadow: '0 0 30px rgba(0, 255, 200, 0.5)' }}>
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
