import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';
import { Button } from '../components/ui';

export const Export: React.FC = () => {
  const frame = useCurrentFrame();

  const modalOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const progressWidth = interpolate(frame, [60, 120], [0, 100], { extrapolateRight: 'clamp' });
  const showComplete = frame > 130;

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      {/* Dimmed background */}
      <AbsoluteFill style={{ background: 'rgba(0, 0, 0, 0.5)' }} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
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
                  <span style={{ color: '#39ff14', fontSize: 24 }}>✓</span>
                </div>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: '#fff',
                }}>
                  Export Complete!
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Button variant="primary" size="lg">Download HTML</Button>
              </div>
            </>
          )}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
