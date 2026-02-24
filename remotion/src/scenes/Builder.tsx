import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background, Grid } from '../components/layout';
import { ScanLine } from '../components/effects';

// Component items in toolbox
const Toolbox: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div style={{
    width: 200,
    background: 'rgba(10, 20, 30, 0.95)',
    borderRight: '1px solid rgba(0, 255, 200, 0.15)',
    padding: 16,
    opacity: visible ? 1 : 0,
  }}>
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: 'rgba(0, 255, 200, 0.6)',
      marginBottom: 16,
    }}>
      COMPONENTS
    </div>
    {['Text', 'Chart', 'Table', 'Gauge', 'Indicator'].map((comp, i) => (
      <div key={i} style={{
        background: 'rgba(0, 255, 200, 0.05)',
        border: '1px solid rgba(0, 255, 200, 0.1)',
        borderRadius: 6,
        padding: 8,
        marginBottom: 8,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#fff',
      }}>
        {comp}
      </div>
    ))}
  </div>
);

// Canvas area with components
const Canvas: React.FC<{ showDrop: boolean; droppedComponent: string | null }> = ({ showDrop, droppedComponent }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{
      flex: 1,
      background: 'rgba(5, 8, 16, 0.9)',
      padding: 24,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    }}>
      {/* Paper preview */}
      <div style={{
        width: 400,
        height: 500,
        background: '#fff',
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        padding: 20,
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#0a0f14',
          marginBottom: 16,
          opacity: interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Test Report - {new Date().toLocaleDateString()}
        </div>

        {/* Existing component */}
        <div style={{
          height: 40,
          background: 'rgba(0, 255, 200, 0.1)',
          border: '1px dashed rgba(0, 255, 200, 0.3)',
          borderRadius: 4,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#0a0f14',
        }}>
          Overall Status: PASS
        </div>

        {/* Drop zone highlight */}
        {showDrop && (
          <div style={{
            height: 80,
            border: '2px dashed #00ffc8',
            borderRadius: 4,
            background: 'rgba(0, 255, 200, 0.05)',
            marginBottom: 12,
          }} />
        )}

        {/* Dropped component */}
        {droppedComponent && (
          <div style={{
            height: 80,
            background: 'rgba(0, 255, 200, 0.15)',
            border: '1px solid rgba(0, 255, 200, 0.3)',
            borderRadius: 4,
            marginBottom: 12,
            padding: 8,
            opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#39ff14',
              marginBottom: 4,
            }}>
              {droppedComponent.toUpperCase()}
            </div>
            <div style={{ height: 50, background: 'rgba(0, 0, 0, 0.1)', borderRadius: 4 }} />
          </div>
        )}
      </div>
    </div>
  );
};

// Properties panel
const PropertiesPanel: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div style={{
    width: 220,
    background: 'rgba(10, 20, 30, 0.95)',
    borderLeft: '1px solid rgba(0, 255, 200, 0.15)',
    padding: 16,
    opacity: visible ? 1 : 0,
  }}>
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: 'rgba(0, 255, 200, 0.6)',
      marginBottom: 16,
    }}>
      PROPERTIES
    </div>
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: 'block',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: 4,
      }}>
        WIDTH
      </label>
      <div style={{
        background: '#050810',
        border: '1px solid rgba(0, 255, 200, 0.2)',
        borderRadius: 4,
        padding: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#fff',
      }}>
        100%
      </div>
    </div>
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: 'block',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: 4,
      }}>
        DATA BINDING
      </label>
      <div style={{
        background: '#050810',
        border: '1px solid rgba(0, 255, 200, 0.2)',
        borderRadius: 4,
        padding: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#00ffc8',
      }}>
        {'{{data.testResults}}'}
      </div>
    </div>
  </div>
);

export const Builder: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase 1: Show builder layout (0-150)
  // Phase 2: Drag-drop animation (150-300)
  // Phase 3: Show properties (300-450)

  const showToolbox = frame > 30;
  const showDrop = frame > 150 && frame < 280;
  const showProperties = frame > 200;
  const droppedComponent = frame > 280 ? 'Chart' : null;

  return (
    <Background>
      <Grid opacity={0.08} />
      <ScanLine />

      <AbsoluteFill style={{ flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{
          height: 48,
          background: 'rgba(10, 20, 30, 0.95)',
          borderBottom: '1px solid rgba(0, 255, 200, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: '#fff',
          }}>
            Test Report v1
          </div>
          <div style={{
            background: '#00ffc8',
            color: '#0a0f14',
            padding: '6px 12px',
            borderRadius: 6,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
          }}>
            Export
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex' }}>
          <Toolbox visible={showToolbox} />
          <Canvas showDrop={showDrop} droppedComponent={droppedComponent} />
          <PropertiesPanel visible={showProperties} />
        </div>
      </AbsoluteFill>
    </Background>
  );
};
