import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';
import { theme } from './config/theme';

const totalDuration = theme.timing.outro.start + theme.timing.outro.duration;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 16:9 - Main composition */}
      <Composition
        id="LabVIEWDemo-16x9"
        component={Video}
        durationInFrames={totalDuration}
        fps={theme.timing.fps}
        width={1920}
        height={1080}
      />

      {/* 9:16 - Stories/Reels */}
      <Composition
        id="LabVIEWDemo-9x16"
        component={Video}
        durationInFrames={totalDuration}
        fps={theme.timing.fps}
        width={1080}
        height={1920}
      />

      {/* 1:1 - Social feed */}
      <Composition
        id="LabVIEWDemo-1x1"
        component={Video}
        durationInFrames={totalDuration}
        fps={theme.timing.fps}
        width={1080}
        height={1080}
      />
    </>
  );
};
