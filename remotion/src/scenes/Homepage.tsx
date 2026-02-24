import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';
import { Button } from '../components/ui';

const Waveform: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = (frame * 2) % 80;

  const pathD = React.useMemo(() => {
    let path = `M ${-offset},75`;
    for (let x = -offset; x < 500; x += 10) {
      const y = 75 + Math.sin(x * 0.05) * 30 + Math.sin(x * 0.02) * 20;
      path += ` L ${x},${y}`;
    }
    return path;
  }, [offset]);

  return (
    <svg width={400} height={150} viewBox="0 0 400 150">
      <defs>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00ffc8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#00ffc8" stopOpacity="1" />
          <stop offset="100%" stopColor="#00ffc8" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke="url(#glow)"
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0 0 8px rgba(0, 255, 200, 0.8))' }}
      />
    </svg>
  );
};

export const Homepage: React.FC = () => {
  const frame = useCurrentFrame();

  const heroOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const featuresOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{ padding: 60 }}>
        {/* Hero section */}
        <div style={{ opacity: heroOpacity, display: 'flex', gap: 60 }}>
          {/* Left: Text */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 48,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 24,
            }}>
              Test Reports That{' '}
              <span style={{ color: '#00ffc8', textShadow: '0 0 20px rgba(0, 255, 200, 0.5)' }}>
                Design Themselves
              </span>
            </h1>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 32,
            }}>
              Design report templates visually. Export self-contained HTML files.
            </p>
            <Button variant="primary" size="lg">START BUILDING FREE</Button>
          </div>

          {/* Right: Oscilloscope display */}
          <div style={{
            width: 450,
            background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.95), rgba(5, 8, 16, 0.95))',
            borderRadius: 12,
            border: '2px solid rgba(0, 255, 200, 0.2)',
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#39ff14' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(0, 255, 200, 0.5)' }}>
                SIGNAL
              </span>
            </div>
            <div style={{
              background: '#050810',
              borderRadius: 8,
              border: '1px solid rgba(0, 255, 200, 0.1)',
              padding: 16,
            }}>
              <Waveform />
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div style={{
          opacity: featuresOpacity,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginTop: 60,
        }}>
          {['Visual Builder', 'HTML Export', 'Any Language'].map((feature, i) => (
            <div key={i} style={{
              background: 'rgba(0, 255, 200, 0.05)',
              border: '1px solid rgba(0, 255, 200, 0.1)',
              borderRadius: 8,
              padding: 16,
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#00ffc8' }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
