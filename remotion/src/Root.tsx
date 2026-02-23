import React from 'react';
import { Composition } from 'remotion';

// Placeholder composition - will be updated with actual video
const PlaceholderVideo: React.FC = () => {
  return (
    <div style={{
      flex: 1,
      backgroundColor: '#0a0f14',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <h1 style={{ color: '#00ffc8', fontSize: 48 }}>LabVIEW Report Builder</h1>
    </div>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LabVIEWDemo-16x9"
        component={PlaceholderVideo}
        durationInFrames={4500}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
