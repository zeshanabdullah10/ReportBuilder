import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

// Feature pill component
const FeaturePill: React.FC<{ icon: string; label: string; delay: number; frame: number }> = ({ icon, label, delay, frame }) => {
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 15,
  });
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const y = interpolate(frame - delay, [0, 15], [20, 0], { extrapolateRight: 'clamp' });

  // Glow pulse
  const glow = interpolate(
    ((frame - delay) % 40) / 40,
    [0, 0.5, 1],
    [0.1, 0.2, 0.1]
  );

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 20px',
      background: `rgba(0, 255, 200, ${0.05 + glow})`,
      border: '1px solid rgba(0, 255, 200, 0.15)',
      borderRadius: 12,
      opacity,
      transform: `scale(${scale}) translateY(${y}px)`,
      boxShadow: `0 0 20px rgba(0, 255, 200, ${glow})`,
    }}>
      <span style={{
        fontSize: 20,
      }}>{icon}</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        color: '#00ffc8',
      }}>{label}</span>
    </div>
  );
};

// Stats component
const Stat: React.FC<{ value: string; label: string; delay: number; frame: number }> = ({ value, label, delay, frame }) => {
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      textAlign: 'center',
      opacity,
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 28,
        fontWeight: 700,
        color: '#00ffc8',
        textShadow: '0 0 15px rgba(0, 255, 200, 0.4)',
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        {label}
      </div>
    </div>
  );
};

const features = [
  { icon: '🎨', label: 'Visual Builder' },
  { icon: '📄', label: 'HTML Export' },
  { icon: '💻', label: 'Any Language' },
];

const stats = [
  { value: '12', label: 'Core components' },
  { value: '0', label: 'External deps' },
  { value: '100%', label: 'Offline capable' },
];

export const Features: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 20], [-20, 0], { extrapolateRight: 'clamp' });

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          {/* Title */}
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 36,
            fontWeight: 600,
            color: '#fff',
            marginBottom: 40,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}>
            Everything you need for{' '}
            <span style={{
              color: '#00ffc8',
              textShadow: '0 0 20px rgba(0, 255, 200, 0.4)',
            }}>professional reports</span>
          </h2>

          {/* Feature pills */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginBottom: 50,
          }}>
            {features.map((feature, i) => (
              <FeaturePill key={feature.label} {...feature} delay={20 + i * 15} frame={frame} />
            ))}
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 60,
            paddingTop: 30,
            borderTop: '1px solid rgba(0, 255, 200, 0.1)',
          }}>
            {stats.map((stat, i) => (
              <Stat key={stat.label} {...stat} delay={60 + i * 15} frame={frame} />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
