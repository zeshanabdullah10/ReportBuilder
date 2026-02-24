import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

// Floating data points
const floatingPoints = [
  { x: 16.26, y: 82.13, delay: 0 },
  { x: 63.32, y: 34.58, delay: 15 },
  { x: 45.21, y: 67.89, delay: 30 },
  { x: 12.45, y: 23.67, delay: 45 },
  { x: 78.91, y: 56.34, delay: 20 },
  { x: 34.56, y: 91.23, delay: 10 },
  { x: 89.12, y: 12.45, delay: 35 },
  { x: 23.78, y: 78.91, delay: 25 },
];

const FloatingPoint: React.FC<{ x: number; y: number; delay: number; frame: number }> = ({ x, y, delay, frame }) => {
  const pulseFrame = frame - delay;
  const opacity = interpolate(
    (pulseFrame % 80) / 80,
    [0, 0.5, 1],
    [0.2, 0.8, 0.2]
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: 4,
        height: 4,
        borderRadius: '50%',
        backgroundColor: '#00ffc8',
        opacity,
      }}
    />
  );
};

// Language indicators from marketing page
const languages = [
  { name: 'Python', color: '#3776AB' },
  { name: 'C#', color: '#512BD4' },
  { name: 'LabVIEW', color: '#FFDB00' },
  { name: 'MATLAB', color: '#E16737' },
  { name: 'JSON', color: '#00ffc8' },
];

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 25 });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Tagline animation
  const taglineOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });
  const taglineY = interpolate(frame, [40, 60], [20, 0], { extrapolateRight: 'clamp' });

  // Language indicators animation
  const langOpacity = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: 'clamp' });

  // Status indicator pulse
  const statusPulse = interpolate(
    (frame % 60) / 60,
    [0, 0.5, 1],
    [1, 1.5, 1]
  );

  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      {/* Floating data points */}
      {floatingPoints.map((point, i) => (
        <FloatingPoint key={i} {...point} frame={frame} />
      ))}

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 1000 }}>
          {/* Status indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 999,
            border: '1px solid rgba(0, 255, 200, 0.2)',
            background: 'rgba(0, 255, 200, 0.05)',
            marginBottom: 24,
            opacity: logoOpacity,
          }}>
            <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
              <span style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#39ff14',
                transform: `scale(${statusPulse})`,
                opacity: 0.75,
              }} />
              <span style={{
                position: 'relative',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#39ff14',
              }} />
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#00ffc8',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}>
              Works With Any Test Framework
            </span>
          </div>

          {/* Main headline from marketing page */}
          <div
            style={{
              transform: `scale(${logoScale})`,
              opacity: logoOpacity,
            }}
          >
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 68,
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Test Reports That{' '}
              <span style={{
                color: '#00ffc8',
                textShadow: '0 0 40px rgba(0, 255, 200, 0.6)',
              }}>
                Design Themselves
              </span>
            </h1>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20,
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: 24,
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
              fontWeight: 400,
              maxWidth: 700,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Design templates visually in your browser. Export self-contained HTML files that generate PDFs offline.
          </p>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              color: '#00ffc8',
              marginTop: 12,
              opacity: subtitleOpacity,
            }}
          >
            Works with JSON from any language
          </p>

          {/* Language indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginTop: 32,
            opacity: langOpacity,
          }}>
            {languages.map((lang, i) => (
              <div key={lang.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: interpolate(frame, [100 + i * 10, 120 + i * 10], [0, 1], { extrapolateRight: 'clamp' }),
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: lang.color,
                }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.5)',
                }}>
                  {lang.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
