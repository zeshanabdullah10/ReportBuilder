import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

// Sample data
const sampleData = {
  meta: {
    reportTitle: "PCB Assembly Test Report",
    reportVersion: "1.0",
    projectName: "Project Alpha - Rev 2.1"
  },
  testInfo: {
    testName: "PCB Functional Test",
    testDate: "2026-02-24T14:30:00",
    operator: "John Smith",
    serialNumber: "SN-PCB-001234"
  },
  summary: {
    totalTests: 200,
    passed: 142,
    failed: 5,
    skipped: 3,
    passRate: 94.67,
    overallStatus: "pass"
  },
  chartData: {
    labels: ["Test 1", "Test 2", "Test 3", "Test 4", "Test 5", "Test 6", "Test 7", "Test 8"],
    values: [95, 87, 92, 78, 91, 88, 94, 85]
  },
  status: {
    overall: "pass"
  },
  approval: {
    testedBy: "John Smith",
    testedDate: "2026-02-24"
  }
};

// Animated cursor
const Cursor: React.FC<{ x: number; y: number; visible: boolean }> = ({ x, y, visible }) => (
  <div style={{
    position: 'absolute',
    left: x,
    top: y,
    opacity: visible ? 1 : 0,
    pointerEvents: 'none',
    zIndex: 1000,
  }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M5 2L19 12L12 13L9 20L5 2Z" fill="#fff" />
    </svg>
    <div style={{
      position: 'absolute',
      left: -25,
      top: -25,
      width: 70,
      height: 70,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
    }} />
  </div>
);

// Top Toolbar
const Toolbar: React.FC<{ previewActive: boolean }> = ({ previewActive }) => (
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
      background: previewActive ? '#00ffc8' : 'rgba(0, 255, 200, 0.1)',
      border: '1px solid rgba(0, 255, 200, 0.3)',
      borderRadius: 8,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: previewActive ? '#0a0f14' : '#00ffc8',
      boxShadow: previewActive ? '0 0 25px rgba(0, 255, 200, 0.5)' : 'none',
    }}>
      {previewActive ? '✓ Preview Active' : 'Preview'}
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

// Report Canvas with real data - Larger
const ReportCanvas: React.FC<{ frame: number }> = ({ frame }) => {
  const chartValues = sampleData.chartData.values;
  
  // Animate numbers counting up
  const animateNumber = (target: number, startFrame: number) => {
    return Math.round(interpolate(
      frame,
      [startFrame, startFrame + 20],
      [0, target],
      { extrapolateRight: 'clamp' }
    ));
  };

  // Animate chart bars
  const getChartBarHeight = (value: number, index: number) => {
    return interpolate(
      frame,
      [30 + index * 3, 50 + index * 3],
      [0, value],
      { extrapolateRight: 'clamp' }
    );
  };
  
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
      {/* Data flow particles */}
      {frame > 10 && frame < 60 && (
        <>
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: interpolate(frame, [10 + i * 3, 40 + i * 3], [80, 400 + (i % 4) * 80]),
                top: interpolate(frame, [10 + i * 3, 40 + i * 3], [150 + (i % 3) * 120, 280]),
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#00ffc8',
                boxShadow: '0 0 15px #00ffc8',
                opacity: interpolate(frame, [10 + i * 3, 35 + i * 3, 40 + i * 3], [0, 1, 0], { extrapolateRight: 'clamp' }),
              }}
            />
          ))}
        </>
      )}

      {/* Paper - Larger */}
      <div style={{
        width: '100%',
        maxWidth: 780,
        height: '95%',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 20px 80px rgba(0, 0, 0, 0.6)',
        padding: 40,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        // Zoom effect when entering preview
        transform: `scale(${interpolate(frame, [0, 15], [0.95, 1], { extrapolateRight: 'clamp' })})`,
      }}>
        {/* Header */}
        <div style={{
          opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' }),
          borderBottom: '3px solid #0066cc',
          paddingBottom: 16,
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>
            {frame > 20 ? sampleData.meta.reportTitle : ''}
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            {frame > 22 ? `${sampleData.testInfo.testName} • ${sampleData.testInfo.serialNumber}` : ''}
          </div>
        </div>

        {/* Chart */}
        <div style={{
          opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateRight: 'clamp' }),
          padding: 20,
          background: '#f8f9fa',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 12 }}>
            TEST RESULTS
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 120 }}>
            {chartValues.map((value, i) => (
              <div key={i} style={{
                flex: 1,
                height: `${getChartBarHeight(value, i)}%`,
                background: `linear-gradient(to top, #0066cc, #00aaff)`,
                borderRadius: '4px 4px 0 0',
                boxShadow: frame > 50 + i * 3 ? '0 0 12px rgba(0, 102, 204, 0.4)' : 'none',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {sampleData.chartData.labels.map((label, i) => (
              <div key={i} style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 10,
                color: '#999',
                opacity: interpolate(frame, [40 + i * 2, 50 + i * 2], [0, 1], { extrapolateRight: 'clamp' }),
              }}>{label}</div>
            ))}
          </div>
        </div>

        {/* Pass/Fail Indicator */}
        <div style={{
          opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateRight: 'clamp' }),
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
            boxShadow: '0 0 25px rgba(57, 255, 20, 0.5)',
            transform: `scale(${spring({ frame: frame - 60, fps: 30, from: 0, to: 1, durationInFrames: 15 })})`,
          }}>
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>✓</span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2a7a2a' }}>PASS</div>
            <div style={{ fontSize: 12, color: '#666' }}>Overall Status</div>
          </div>
        </div>

        {/* Test Summary */}
        <div style={{
          opacity: interpolate(frame, [65, 80], [0, 1], { extrapolateRight: 'clamp' }),
          padding: 20,
          background: '#f8f9fa',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 12 }}>
            TEST SUMMARY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#333' }}>
                {animateNumber(sampleData.summary.totalTests, 70)}
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#2a7a2a' }}>
                {animateNumber(sampleData.summary.passed, 72)}
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>Passed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#cc3333' }}>
                {animateNumber(sampleData.summary.failed, 74)}
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>Failed</div>
            </div>
          </div>
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#2a7a2a' }}>
              {animateNumber(sampleData.summary.passRate, 76).toFixed(1)}% Pass Rate
            </span>
          </div>
        </div>

        {/* Signoff */}
        <div style={{
          opacity: interpolate(frame, [80, 95], [0, 1], { extrapolateRight: 'clamp' }),
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: 16,
          borderTop: '2px solid #e0e0e0',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#666' }}>Tested By</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginTop: 6 }}>
              {sampleData.approval.testedBy}
            </div>
            <div style={{ borderBottom: '2px solid #333', width: 160, marginTop: 10 }} />
            <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
              {sampleData.approval.testedDate}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Approved By</div>
            <div style={{ fontSize: 16, color: '#999', marginTop: 6 }}>_____________</div>
            <div style={{ borderBottom: '2px solid #333', width: 160, marginTop: 10 }} />
            <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>Pending</div>
          </div>
        </div>
      </div>

      {/* "Data Populated" indicator */}
      {frame > 100 && (
        <div style={{
          position: 'absolute',
          bottom: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: 'rgba(57, 255, 20, 0.15)',
          border: '1px solid rgba(57, 255, 20, 0.4)',
          borderRadius: 8,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#39ff14',
          opacity: interpolate(frame, [100, 110, 150, 160], [0, 1, 1, 0], { extrapolateRight: 'clamp' }),
        }}>
          ✓ Live Data from JSON
        </div>
      )}
    </div>
  );
};

export const Preview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cursor animation - clicks preview button
  const cursorX = interpolate(frame, [0, 20, 25], [850, 920, 920], { extrapolateRight: 'clamp' });
  const cursorY = interpolate(frame, [0, 20, 25], [350, 24, 24], { extrapolateRight: 'clamp' });
  const showCursor = frame < 35;

  return (
    <Background>
      <Grid opacity={0.05} />
      <ScanLine />

      <AbsoluteFill>
        {/* Toolbar */}
        <Toolbar previewActive={frame > 30} />

        {/* Main content */}
        <div style={{ display: 'flex', height: 'calc(100% - 48px)' }}>
          <ReportCanvas frame={frame} />
        </div>

        {/* Cursor */}
        <Cursor x={cursorX} y={cursorY} visible={showCursor} />
      </AbsoluteFill>
    </Background>
  );
};
