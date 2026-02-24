import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';
import { Button, Card } from '../components/ui';

export const Signup: React.FC = () => {
  const frame = useCurrentFrame();

  const cardOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  // Typewriter effect for email
  const emailText = 'engineer@example.com';
  const visibleChars = Math.min(Math.floor(frame / 3), emailText.length);
  const displayedEmail = emailText.slice(0, visibleChars);

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: cardOpacity }}>
          <Card width={400} height={350}>
            <div style={{ padding: 32 }}>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: '#fff',
                marginBottom: 8,
              }}>
                Create Account
              </h2>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: 32,
              }}>
                Start building reports in seconds
              </p>

              {/* Email input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'rgba(0, 255, 200, 0.6)',
                  marginBottom: 8,
                }}>
                  EMAIL
                </label>
                <div style={{
                  background: '#050810',
                  border: '1px solid rgba(0, 255, 200, 0.2)',
                  borderRadius: 8,
                  padding: 12,
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    color: '#fff',
                  }}>
                    {displayedEmail}
                    {visibleChars < emailText.length && (
                      <span style={{ opacity: 0.5 }}>|</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Password input */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'rgba(0, 255, 200, 0.6)',
                  marginBottom: 8,
                }}>
                  PASSWORD
                </label>
                <div style={{
                  background: '#050810',
                  border: '1px solid rgba(0, 255, 200, 0.2)',
                  borderRadius: 8,
                  padding: 12,
                }}>
                  <span style={{ color: '#39ff14' }}>••••••••</span>
                </div>
              </div>

              <Button variant="primary" size="lg">CREATE ACCOUNT</Button>
            </div>
          </Card>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
