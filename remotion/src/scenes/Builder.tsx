import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

// Sample data from component-test-sample.json
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
  status: { overall: "pass" },
  approval: { testedBy: "John Smith", testedDate: "2026-02-24" }
};

// Animated cursor
const Cursor: React.FC<{ x: number; y: number; visible: boolean; dragging: boolean }> = ({ x, y, visible, dragging }) => (
  <div style={{
    position: 'absolute',
    left: x,
    top: y,
    opacity: visible ? 1 : 0,
    pointerEvents: 'none',
    zIndex: 1000,
    transform: dragging ? 'scale(1.2)' : 'scale(1)',
  }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M5 2L19 12L12 13L9 20L5 2Z" fill={dragging ? '#00ffc8' : '#fff'} />
    </svg>
    <div style={{
      position: 'absolute',
      left: -25,
      top: -25,
      width: 70,
      height: 70,
      borderRadius: '50%',
      background: dragging
        ? 'radial-gradient(circle, rgba(0, 255, 200, 0.5) 0%, transparent 70%)'
        : 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
    }} />
  </div>
);

// Toolbox component
const Toolbox: React.FC<{ highlightedItem: string | null }> = ({ highlightedItem }) => {
  const items = [
    { id: 'text', icon: 'T', name: 'Text' },
    { id: 'chart', icon: '📊', name: 'Chart' },
    { id: 'indicator', icon: '✓', name: 'Indicator' },
    { id: 'summary', icon: '📈', name: 'Summary' },
    { id: 'signoff', icon: '✍️', name: 'Signoff' },
  ];

  return (
    <div style={{
      width: 160,
      height: '100%',
      background: '#050810',
      borderRight: '2px solid #00ffc8',
      padding: '10px 0',
    }}>
      <div style={{
        padding: '0 10px 10px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: '#00ffc8',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        Components
      </div>
      {items.map((item) => {
        const isHighlighted = highlightedItem === item.id;
        return (
          <div key={item.id} style={{
            margin: '3px 6px',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: isHighlighted ? 'rgba(0, 255, 200, 0.25)' : 'transparent',
            border: `1px solid ${isHighlighted ? 'rgba(0, 255, 200, 0.6)' : 'rgba(0, 255, 200, 0.12)'}`,
            borderRadius: 6,
            boxShadow: isHighlighted ? '0 0 20px rgba(0, 255, 200, 0.5)' : 'none',
          }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: isHighlighted ? '#00ffc8' : 'rgba(255, 255, 255, 0.6)',
            }}>
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Report Canvas - Much larger to fill video
const ReportCanvas: React.FC<{
  frame: number;
  components: string[];
  dropZone: string | null;
}> = ({ frame, components, dropZone }) => {
  
  const hasText = components.includes('text');
  const hasChart = components.includes('chart');
  const hasIndicator = components.includes('indicator');
  const hasSummary = components.includes('summary');
  const hasSignoff = components.includes('signoff');

  return (
    <div style={{
      flex: 1,
      background: '#0a0f14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: 30,
    }}>
      {/* Paper - Much Larger, fills most of the screen */}
      <div style={{
        width: '100%',
        maxWidth: 780,
        height: '95%',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 20px 80px rgba(0, 0, 0, 0.6)',
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        transform: `scale(${interpolate(frame, [0, 20], [0.92, 1], { extrapolateRight: 'clamp' })})`,
      }}>
        {/* Header */}
        {hasText && (
          <div style={{
            opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
            borderBottom: '3px solid #0066cc',
            paddingBottom: 16,
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a' }}>
              Test Report
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#0066cc',
              marginTop: 6,
              background: 'rgba(0, 102, 204, 0.08)',
              padding: '6px 12px',
              borderRadius: 6,
              display: 'inline-block',
              border: '1px solid rgba(0, 102, 204, 0.2)',
            }}>
              {'{{data.meta.reportTitle}}'}
            </div>
          </div>
        )}
        
        {!hasText && dropZone === 'text' && (
          <div style={{
            height: 80,
            border: '3px dashed #00ffc8',
            borderRadius: 8,
            background: 'rgba(0, 255, 200, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#00ffc8' }}>
              Drop Header here
            </span>
          </div>
        )}

        {/* Chart */}
        {hasChart && (
          <div style={{
            opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
            padding: 20,
            background: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 12 }}>
              TEST RESULTS
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 140 }}>
              {sampleData.chartData.values.map((value, i) => (
                <div key={i} style={{
                  flex: 1,
                  height: `${value}%`,
                  background: 'linear-gradient(to top, #0066cc, #00aaff)',
                  borderRadius: '4px 4px 0 0',
                }} />
              ))}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#0066cc',
              marginTop: 12,
              background: 'rgba(0, 102, 204, 0.08)',
              padding: '6px 12px',
              borderRadius: 6,
              display: 'inline-block',
              border: '1px solid rgba(0, 102, 204, 0.2)',
            }}>
              {'{{data.chartData.values}}'}
            </div>
          </div>
        )}

        {!hasChart && dropZone === 'chart' && (
          <div style={{
            height: 160,
            border: '3px dashed #00ffc8',
            borderRadius: 8,
            background: 'rgba(0, 255, 200, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#00ffc8' }}>
              Drop Chart here
            </span>
          </div>
        )}

        {/* Indicator and Summary Row */}
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Pass/Fail Indicator */}
          {hasIndicator && (
            <div style={{
              flex: 1,
              opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
              padding: 20,
              background: 'rgba(57, 255, 20, 0.1)',
              border: '3px solid #39ff14',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: '#39ff14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(57, 255, 20, 0.5)',
              }}>
                <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>✓</span>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#2a7a2a' }}>PASS</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: '#2a7a2a',
                  marginTop: 4,
                }}>
                  {'{{data.status.overall}}'}
                </div>
              </div>
            </div>
          )}

          {!hasIndicator && dropZone === 'indicator' && (
            <div style={{
              flex: 1,
              height: 90,
              border: '3px dashed #00ffc8',
              borderRadius: 8,
              background: 'rgba(0, 255, 200, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#00ffc8' }}>
                Indicator
              </span>
            </div>
          )}

          {/* Test Summary */}
          {hasSummary && (
            <div style={{
              flex: 1,
              opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
              padding: 20,
              background: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#333' }}>200</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Total</div>
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#2a7a2a' }}>142</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Passed</div>
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#cc3333' }}>5</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Failed</div>
                </div>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#0066cc',
                marginTop: 12,
                textAlign: 'center',
              }}>
                {'{{data.summary.*}}'}
              </div>
            </div>
          )}

          {!hasSummary && dropZone === 'summary' && (
            <div style={{
              flex: 1,
              height: 90,
              border: '3px dashed #00ffc8',
              borderRadius: 8,
              background: 'rgba(0, 255, 200, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#00ffc8' }}>
                Summary
              </span>
            </div>
          )}
        </div>

        {/* Signoff */}
        {hasSignoff && (
          <div style={{
            opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
            marginTop: 'auto',
            paddingTop: 20,
            borderTop: '2px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#666' }}>Tested By</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginTop: 6 }}>John Smith</div>
              <div style={{ borderBottom: '2px solid #333', width: 160, marginTop: 10 }} />
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#0066cc',
                marginTop: 6,
              }}>
                {'{{data.approval.testedBy}}'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#666' }}>Approved By</div>
              <div style={{ fontSize: 16, color: '#999', marginTop: 6 }}>_____________</div>
              <div style={{ borderBottom: '2px solid #333', width: 160, marginTop: 10 }} />
            </div>
          </div>
        )}

        {!hasSignoff && dropZone === 'signoff' && (
          <div style={{
            height: 80,
            border: '3px dashed #00ffc8',
            borderRadius: 8,
            background: 'rgba(0, 255, 200, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 'auto',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#00ffc8' }}>
              Drop Signoff here
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Properties Panel
const PropertiesPanel: React.FC<{ visible: boolean; component: string | null }> = ({ visible, component }) => (
  <div style={{
    width: 180,
    background: '#050810',
    borderLeft: '1px solid rgba(0, 255, 200, 0.15)',
    padding: 14,
    opacity: visible ? 1 : 0,
  }}>
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: 'rgba(0, 255, 200, 0.6)',
      marginBottom: 14,
      textTransform: 'uppercase',
    }}>
      Properties
    </div>
    {visible && component && (
      <div style={{
        background: 'rgba(0, 255, 200, 0.1)',
        borderRadius: 8,
        padding: 12,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#00ffc8',
          marginBottom: 10,
        }}>
          {component.toUpperCase()}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: 'rgba(255, 255, 255, 0.5)',
        }}>
          Data Binding:
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: '#00ffc8',
          background: '#0a0f14',
          padding: 8,
          borderRadius: 6,
          marginTop: 6,
        }}>
          {component === 'text' && '{{data.meta.reportTitle}}'}
          {component === 'chart' && '{{data.chartData.values}}'}
          {component === 'indicator' && '{{data.status.overall}}'}
          {component === 'summary' && '{{data.summary.*}}'}
          {component === 'signoff' && '{{data.approval.*}}'}
        </div>
      </div>
    )}
  </div>
);

// Top Toolbar
const Toolbar = () => (
  <div style={{
    height: 48,
    background: '#050810',
    borderBottom: '1px solid rgba(0, 255, 200, 0.15)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
  }}>
    <div style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: 16,
      fontWeight: 600,
      color: '#00ffc8',
    }}>
      Report Builder
    </div>
    <div style={{ flex: 1 }} />
    <div style={{
      padding: '8px 18px',
      background: 'rgba(0, 255, 200, 0.1)',
      border: '1px solid rgba(0, 255, 200, 0.3)',
      borderRadius: 8,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: '#00ffc8',
    }}>
      Preview
    </div>
    <div style={{
      marginLeft: 14,
      padding: '8px 18px',
      background: 'rgba(0, 255, 200, 0.1)',
      border: '1px solid rgba(0, 255, 200, 0.3)',
      borderRadius: 8,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: '#00ffc8',
    }}>
      Export
    </div>
  </div>
);

export const Builder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const interfaceOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  // Animation phases (540 frames total):
  // 0-30: Interface appears
  // 30-120: Text component
  // 120-210: Chart component
  // 210-300: Indicator component
  // 300-390: Summary component
  // 390-480: Signoff component
  // 480+: All done

  let highlightedItem: string | null = null;
  let dropZone: string | null = null;
  let cursorX = 0;
  let cursorY = 0;
  let showCursor = false;
  let isDragging = false;
  let components: string[] = [];
  let currentComponent: string | null = null;
  let showProperties = false;

  // Phase 1: Text component (30-120)
  if (frame >= 30 && frame < 120) {
    highlightedItem = 'text';
    showCursor = true;
    
    if (frame < 60) {
      cursorX = interpolate(frame, [30, 60], [700, 80]);
      cursorY = interpolate(frame, [30, 60], [450, 90]);
    } else if (frame < 90) {
      cursorX = interpolate(frame, [60, 90], [80, 550]);
      cursorY = interpolate(frame, [60, 90], [90, 180]);
      isDragging = true;
      dropZone = 'text';
    } else {
      components = ['text'];
      currentComponent = 'text';
      showProperties = true;
    }
  }

  // Phase 2: Chart component (120-210)
  if (frame >= 120) {
    components = ['text'];
    showProperties = true;
    currentComponent = 'text';
  }
  if (frame >= 120 && frame < 210) {
    highlightedItem = 'chart';
    showCursor = true;
    
    if (frame < 140) {
      cursorX = interpolate(frame, [120, 140], [550, 80]);
      cursorY = interpolate(frame, [120, 140], [180, 140]);
    } else if (frame < 180) {
      cursorX = interpolate(frame, [140, 180], [80, 550]);
      cursorY = interpolate(frame, [140, 180], [140, 320]);
      isDragging = true;
      dropZone = 'chart';
    } else {
      components = ['text', 'chart'];
      currentComponent = 'chart';
    }
  }

  // Phase 3: Indicator component (210-300)
  if (frame >= 210) {
    components = ['text', 'chart'];
    currentComponent = 'chart';
  }
  if (frame >= 210 && frame < 300) {
    highlightedItem = 'indicator';
    showCursor = true;
    
    if (frame < 230) {
      cursorX = interpolate(frame, [210, 230], [550, 80]);
      cursorY = interpolate(frame, [210, 230], [320, 190]);
    } else if (frame < 270) {
      cursorX = interpolate(frame, [230, 270], [80, 400]);
      cursorY = interpolate(frame, [230, 270], [190, 480]);
      isDragging = true;
      dropZone = 'indicator';
    } else {
      components = ['text', 'chart', 'indicator'];
      currentComponent = 'indicator';
    }
  }

  // Phase 4: Summary component (300-390)
  if (frame >= 300) {
    components = ['text', 'chart', 'indicator'];
    currentComponent = 'indicator';
  }
  if (frame >= 300 && frame < 390) {
    highlightedItem = 'summary';
    showCursor = true;
    
    if (frame < 320) {
      cursorX = interpolate(frame, [300, 320], [400, 80]);
      cursorY = interpolate(frame, [300, 320], [480, 240]);
    } else if (frame < 360) {
      cursorX = interpolate(frame, [320, 360], [80, 700]);
      cursorY = interpolate(frame, [320, 360], [240, 480]);
      isDragging = true;
      dropZone = 'summary';
    } else {
      components = ['text', 'chart', 'indicator', 'summary'];
      currentComponent = 'summary';
    }
  }

  // Phase 5: Signoff component (390-480)
  if (frame >= 390) {
    components = ['text', 'chart', 'indicator', 'summary'];
    currentComponent = 'summary';
  }
  if (frame >= 390 && frame < 480) {
    highlightedItem = 'signoff';
    showCursor = true;
    
    if (frame < 410) {
      cursorX = interpolate(frame, [390, 410], [700, 80]);
      cursorY = interpolate(frame, [390, 410], [480, 290]);
    } else if (frame < 450) {
      cursorX = interpolate(frame, [410, 450], [80, 550]);
      cursorY = interpolate(frame, [410, 450], [290, 680]);
      isDragging = true;
      dropZone = 'signoff';
    } else {
      components = ['text', 'chart', 'indicator', 'summary', 'signoff'];
      currentComponent = 'signoff';
    }
  }

  // Final state: All components visible (480+)
  if (frame >= 480) {
    components = ['text', 'chart', 'indicator', 'summary', 'signoff'];
    currentComponent = 'signoff';
    showCursor = false;
  }

  return (
    <Background>
      <Grid opacity={0.05} />
      <ScanLine />

      <AbsoluteFill style={{ opacity: interfaceOpacity }}>
        <Toolbar />
        <div style={{ display: 'flex', height: 'calc(100% - 48px)' }}>
          <Toolbox highlightedItem={highlightedItem} />
          <ReportCanvas frame={frame} components={components} dropZone={dropZone} />
          <PropertiesPanel visible={showProperties} component={currentComponent} />
        </div>
        <Cursor x={cursorX} y={cursorY} visible={showCursor} dragging={isDragging} />
      </AbsoluteFill>
    </Background>
  );
};
