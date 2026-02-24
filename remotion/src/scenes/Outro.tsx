import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

// Floating data points
const floatingPoints = [
  { x: 12, y: 15, delay: 0 },
  { x: 88, y: 20, delay: 10 },
  { x: 8, y: 75, delay: 25 },
  { x: 92, y: 80, delay: 15 },
  { x: 50, y: 8, delay: 20 },
  { x: 35, y: 92, delay: 5 },
  { x: 65, y: 88, delay: 30 },
];

const FloatingPoint: React.FC<{ x: number; y: number; delay: number; frame: number }> = ({ x, y, delay, frame }) => {
  const pulseFrame = frame - delay;
  const opacity = interpolate(
    (pulseFrame % 50) / 50,
    [0, 0.5, 1],
    [0.2, 0.7, 0.2]
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: 5,
        height: 5,
        borderRadius: '50%',
        backgroundColor: '#00ffc8',
        opacity,
        boxShadow: '0 0 10px rgba(0, 255, 200, 0.5)',
      }}
    />
  );
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 20 });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  
  const ctaScale = spring({ frame: frame - 20, fps, from: 0.8, to: 1, durationInFrames: 15 });
  const ctaOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

  const featuresOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' });

  // Button glow pulse
  const buttonGlow = interpolate(
    (frame % 30) / 30,
    [0, 0.5, 1],
    [0.3, 0.6, 0.3]
  );

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      {/* Floating background points */}
      {floatingPoints.map((point, i) => (
        <FloatingPoint key={i} {...point} frame={frame} />
      ))}

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})` }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 48,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 8,
            }}>
              Test Reports That{' '}
              <span style={{
                color: '#00ffc8',
                textShadow: '0 0 30px rgba(0, 255, 200, 0.5)',
              }}>
                Design Themselves
              </span>
            </h1>
          </div>

          {/* CTA */}
          <div style={{ opacity: ctaOpacity, transform: `scale(${ctaScale})`, marginTop: 24 }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 28,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: 12,
            }}>
              Start Building Today
            </h2>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.5)',
            }}>
              Free to start. No credit card required.
            </p>
          </div>

          {/* Feature recap */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            marginTop: 32,
            opacity: featuresOpacity,
          }}>
            {[
              { text: 'Visual Builder', icon: '🎨' },
              { text: 'HTML Export', icon: '📄' },
              { text: 'Any Language', icon: '🔌' },
              { text: 'Offline Ready', icon: '🔒' },
            ].map((feature, i) => (
              <div key={feature.text} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                background: 'rgba(0, 255, 200, 0.08)',
                border: '1px solid rgba(0, 255, 200, 0.2)',
                borderRadius: 999,
                opacity: interpolate(frame, [50 + i * 10, 60 + i * 10], [0, 1], { extrapolateRight: 'clamp' }),
              }}>
                <span style={{ fontSize: 16 }}>{feature.icon}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: '#00ffc8',
                }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div style={{
            marginTop: 40,
            opacity: interpolate(frame, [70, 85], [0, 1], { extrapolateRight: 'clamp' }),
            boxShadow: `0 0 30px rgba(0, 255, 200, ${buttonGlow})`,
            borderRadius: 10,
            display: 'inline-block',
          }}>
            <div style={{
              background: '#00ffc8',
              color: '#0a0f14',
              padding: '16px 32px',
              borderRadius: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              fontWeight: 600,
            }}>
              START BUILDING FREE
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
