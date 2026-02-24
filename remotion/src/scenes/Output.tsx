import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

// Sample data for the final report
const sampleData = {
  meta: {
    reportTitle: "PCB Assembly Test Report",
    projectName: "Project Alpha - Rev 2.1"
  },
  testInfo: {
    testName: "PCB Functional Test",
    serialNumber: "SN-PCB-001234"
  },
  summary: {
    totalTests: 200,
    passed: 142,
    failed: 5,
    passRate: 94.67
  },
  chartData: {
    labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"],
    values: [95, 87, 92, 78, 91, 88, 94, 85]
  },
  approval: {
    testedBy: "John Smith",
    testedDate: "2026-02-24"
  }
};

export const Output: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Browser window animation
  const browserScale = spring({ frame, fps, from: 0.85, to: 1, durationInFrames: 15 });
  const browserOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  // Print dialog animation
  const showDialog = frame > 40;
  const dialogOpacity = interpolate(frame, [40, 50], [0, 1], { extrapolateRight: 'clamp' });
  const dialogY = interpolate(frame, [40, 50], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <Background>
      <Grid opacity={0.05} />
      <ScanLine />

      <AbsoluteFill style={{ 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 30,
      }}>
        {/* Browser Window */}
        <div style={{
          width: '100%',
          maxWidth: 1000,
          opacity: browserOpacity,
          transform: `scale(${browserScale})`,
        }}>
          {/* Browser Chrome */}
          <div style={{
            height: 40,
            background: '#1a1a1a',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: 10,
          }}>
            {/* Traffic lights */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#28ca41' }} />
            </div>
            
            {/* URL bar */}
            <div style={{
              flex: 1,
              height: 26,
              background: '#2a2a2a',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              gap: 8,
            }}>
              <span style={{ color: '#39ff14', fontSize: 12 }}>🔒</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.5)',
              }}>
                file:///reports/pcb-test-report.html
              </span>
            </div>

            {/* Print icon */}
            <div style={{
              padding: '6px 12px',
              background: 'rgba(0, 255, 200, 0.15)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>🖨️</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#00ffc8',
              }}>Ctrl+P</span>
            </div>
          </div>

          {/* Browser Content - The Report */}
          <div style={{
            background: '#fff',
            borderRadius: '0 0 12px 12px',
            padding: 30,
            height: 520,
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Report Header */}
            <div style={{ marginBottom: 16, borderBottom: '3px solid #0066cc', paddingBottom: 14 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>
                {sampleData.meta.reportTitle}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                {sampleData.testInfo.testName} • {sampleData.testInfo.serialNumber}
              </div>
            </div>

            {/* Chart */}
            <div style={{
              padding: 14,
              background: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 10 }}>
                TEST RESULTS
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
                {sampleData.chartData.values.map((value, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${value}%`,
                    background: 'linear-gradient(to top, #0066cc, #00aaff)',
                    borderRadius: '3px 3px 0 0',
                  }} />
                ))}
              </div>
            </div>

            {/* Status & Summary Row */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              {/* Pass indicator */}
              <div style={{
                flex: 1,
                padding: 14,
                background: 'rgba(57, 255, 20, 0.1)',
                border: '3px solid #39ff14',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#39ff14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>✓</span>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#2a7a2a' }}>PASS</div>
                  <div style={{ fontSize: 10, color: '#666' }}>Overall</div>
                </div>
              </div>

              {/* Summary stats */}
              <div style={{
                flex: 2,
                padding: 14,
                background: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#333' }}>{sampleData.summary.totalTests}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>Total</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2a7a2a' }}>{sampleData.summary.passed}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>Passed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#cc3333' }}>{sampleData.summary.failed}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>Failed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2a7a2a' }}>{sampleData.summary.passRate}%</div>
                  <div style={{ fontSize: 10, color: '#666' }}>Rate</div>
                </div>
              </div>
            </div>

            {/* Signoff */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '2px solid #e0e0e0',
              paddingTop: 14,
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#666' }}>Tested By</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginTop: 4 }}>{sampleData.approval.testedBy}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{sampleData.approval.testedDate}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#666' }}>Approved By</div>
                <div style={{ fontSize: 14, color: '#999', marginTop: 4 }}>Pending...</div>
              </div>
            </div>

            {/* Print Dialog Overlay */}
            {showDialog && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                padding: 24,
                opacity: dialogOpacity,
                transform: `translateY(${dialogY}px)`,
              }}>
                <div style={{
                  width: 300,
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 15px 50px rgba(0, 0, 0, 0.35)',
                  overflow: 'hidden',
                }}>
                  {/* Print dialog header */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Print</span>
                    <span style={{ fontSize: 14, color: '#999' }}>✕</span>
                  </div>
                  
                  {/* Print dialog content */}
                  <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Destination</div>
                      <div style={{
                        padding: '8px 12px',
                        background: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#333',
                      }}>
                        Save as PDF
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Pages</div>
                      <div style={{
                        padding: '8px 12px',
                        background: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#333',
                      }}>
                        All • 1 page
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <div style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        borderRadius: 6,
                        textAlign: 'center',
                        fontSize: 12,
                        color: '#666',
                      }}>
                        Cancel
                      </div>
                      <div style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: '#0066cc',
                        borderRadius: 6,
                        textAlign: 'center',
                        fontSize: 12,
                        color: '#fff',
                        fontWeight: 600,
                      }}>
                        Save
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>

      {/* Info badges at bottom */}
      <AbsoluteFill style={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 24,
      }}>
        <div style={{
          display: 'flex',
          gap: 14,
          opacity: interpolate(frame, [25, 35], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            padding: '10px 18px',
            background: 'rgba(0, 255, 200, 0.1)',
            border: '1px solid rgba(0, 255, 200, 0.25)',
            borderRadius: 8,
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#00ffc8',
            }}>
              ✓ Standalone HTML
            </span>
          </div>
          <div style={{
            padding: '10px 18px',
            background: 'rgba(0, 255, 200, 0.1)',
            border: '1px solid rgba(0, 255, 200, 0.25)',
            borderRadius: 8,
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#00ffc8',
            }}>
              ✓ No Dependencies
            </span>
          </div>
          <div style={{
            padding: '10px 18px',
            background: 'rgba(0, 255, 200, 0.1)',
            border: '1px solid rgba(0, 255, 200, 0.25)',
            borderRadius: 8,
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#00ffc8',
            }}>
              ✓ Headless Print Ready
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
