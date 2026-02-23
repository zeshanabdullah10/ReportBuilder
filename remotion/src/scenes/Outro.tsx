import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 30 });
  const ctaOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const urlOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          {/* CTA */}
          <div style={{ opacity: ctaOpacity, transform: `scale(${ctaScale})` }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 48,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 16,
            }}>
              Start Building{' '}
              <span style={{ color: '#00ffc8', textShadow: '0 0 30px rgba(0, 255, 200, 0.5)' }}>
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
