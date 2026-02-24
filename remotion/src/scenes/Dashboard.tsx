import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

const TemplateCard: React.FC<{ index: number; delay: number }> = ({ index, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 20,
  });
  const opacity = interpolate(frame - delay, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  const templates = [
    { name: 'Test Report v1', date: '2 days ago' },
    { name: 'QC Summary', date: '1 week ago' },
    { name: 'Production Log', date: '2 weeks ago' },
  ];

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      width: 200,
      height: 160,
      background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.9), rgba(15, 30, 45, 0.8))',
      borderRadius: 12,
      border: '1px solid rgba(0, 255, 200, 0.15)',
      padding: 16,
    }}>
      {/* Preview placeholder */}
      <div style={{
        height: 80,
        background: '#050810',
        borderRadius: 8,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 4, background: 'rgba(0, 255, 200, 0.1)' }} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#fff' }}>
        {templates[index].name}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255, 255, 255, 0.4)' }}>
        {templates[index].date}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{ padding: 40 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          opacity: headerOpacity,
        }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            fontWeight: 600,
            color: '#fff',
          }}>
            Dashboard
          </h1>
          <div style={{
            background: '#00ffc8',
            color: '#0a0f14',
            padding: '8px 16px',
            borderRadius: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 600,
          }}>
            + New Template
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
          {['Total Templates: 3', 'Downloads: 47', 'Plan: Free'].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(0, 255, 200, 0.05)',
              border: '1px solid rgba(0, 255, 200, 0.1)',
              borderRadius: 8,
              padding: 16,
              opacity: interpolate(frame, [20 + i * 10, 40 + i * 10], [0, 1], { extrapolateRight: 'clamp' }),
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                {stat}
              </span>
            </div>
          ))}
        </div>

        {/* Template grid */}
        <div style={{ display: 'flex', gap: 24 }}>
          {[0, 1, 2].map((i) => (
            <TemplateCard key={i} index={i} delay={60 + i * 15} />
          ))}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
