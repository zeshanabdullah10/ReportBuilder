import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

export const Export: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Export modal (0-40)
  // Phase 2: Progress (40-70)
  // Phase 3: Complete with print options (70-90)

  // Modal animation
  const modalScale = spring({ frame, fps, from: 0.9, to: 1, durationInFrames: 15 });
  const modalOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  // Progress bar animation
  const progressWidth = interpolate(frame, [20, 60], [0, 100], { extrapolateRight: 'clamp' });
  const progressGlow = interpolate(
    (frame % 15) / 15,
    [0, 0.5, 1],
    [0.3, 0.6, 0.3]
  );

  const showComplete = frame > 65;

  // Checkmark animation
  const checkScale = spring({ frame: frame - 65, fps, from: 0, to: 1, durationInFrames: 10 });

  // Print options animation
  const printOptionsOpacity = interpolate(frame, [75, 85], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      {/* Dimmed background */}
      <AbsoluteFill style={{ background: 'rgba(0, 0, 0, 0.6)' }} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          opacity: modalOpacity,
          transform: `scale(${modalScale})`,
          width: 480,
          background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.98), rgba(15, 30, 45, 0.98))',
          borderRadius: 16,
          border: '1px solid rgba(0, 255, 200, 0.2)',
          padding: 32,
          boxShadow: '0 0 60px rgba(0, 255, 200, 0.15)',
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
                height: 10,
                background: 'rgba(0, 255, 200, 0.1)',
                borderRadius: 5,
                marginBottom: 16,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progressWidth}%`,
                  height: '100%',
                  background: '#00ffc8',
                  borderRadius: 5,
                  boxShadow: `0 0 15px rgba(0, 255, 200, ${progressGlow})`,
                }} />
              </div>

              {/* Percentage */}
              <div style={{
                textAlign: 'center',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: '#00ffc8',
                textShadow: '0 0 20px rgba(0, 255, 200, 0.5)',
              }}>
                {Math.round(progressWidth)}%
              </div>

              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
                marginTop: 8,
              }}>
                Generating standalone HTML...
              </p>
            </>
          ) : (
            <>
              {/* Complete state */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(57, 255, 20, 0.1)',
                  border: '2px solid #39ff14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  transform: `scale(${checkScale})`,
                  boxShadow: '0 0 25px rgba(57, 255, 20, 0.4)',
                }}>
                  <span style={{
                    color: '#39ff14',
                    fontSize: 28,
                    fontWeight: 700,
                  }}>✓</span>
                </div>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 16,
                  color: '#fff',
                  fontWeight: 600,
                }}>
                  Export Complete!
                </p>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: 8,
                }}>
                  pcb-test-report.html • 24KB
                </p>
              </div>

              {/* Download button */}
              <div style={{
                textAlign: 'center',
                marginBottom: 16,
              }}>
                <div style={{
                  background: '#00ffc8',
                  color: '#0a0f14',
                  padding: '14px 28px',
                  borderRadius: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-block',
                  boxShadow: '0 0 25px rgba(0, 255, 200, 0.4)',
                }}>
                  ⬇ Download HTML
                </div>
              </div>

              {/* Print options */}
              <div style={{
                opacity: printOptionsOpacity,
                borderTop: '1px solid rgba(0, 255, 200, 0.1)',
                paddingTop: 16,
                marginTop: 8,
              }}>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  Print Options
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    flex: 1,
                    padding: 12,
                    background: 'rgba(0, 255, 200, 0.05)',
                    border: '1px solid rgba(0, 255, 200, 0.15)',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>🖨️</div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: '#00ffc8',
                    }}>
                      Browser Print
                    </div>
                  </div>
                  <div style={{
                    flex: 1,
                    padding: 12,
                    background: 'rgba(0, 255, 200, 0.05)',
                    border: '1px solid rgba(0, 255, 200, 0.15)',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>🤖</div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: '#00ffc8',
                    }}>
                      Headless Mode
                    </div>
                  </div>
                </div>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: 'rgba(255, 255, 255, 0.3)',
                  marginTop: 12,
                  textAlign: 'center',
                }}>
                  Use Puppeteer/Playwright for automated PDF generation
                </p>
              </div>
            </>
          )}
        </div>
      </AbsoluteFill>

      {/* Info text at bottom */}
      {showComplete && (
        <AbsoluteFill style={{
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 60,
        }}>
          <div style={{
            padding: '10px 20px',
            background: 'rgba(0, 255, 200, 0.08)',
            border: '1px solid rgba(0, 255, 200, 0.2)',
            borderRadius: 8,
            opacity: printOptionsOpacity,
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#00ffc8',
            }}>
              ✓ Standalone HTML • No dependencies • Works offline
            </span>
          </div>
        </AbsoluteFill>
      )}
    </Background>
  );
};
