import React from 'react';
import { Sequence } from 'remotion';
import {
  Intro,
  Homepage,
  Signup,
  Dashboard,
  Builder,
  Export,
  Outro,
} from './scenes';
import { theme } from './config/theme';

const { timing } = theme;

export const Video: React.FC = () => {
  return (
    <>
      <Sequence from={timing.intro.start} durationInFrames={timing.intro.duration}>
        <Intro />
      </Sequence>

      <Sequence from={timing.homepage.start} durationInFrames={timing.homepage.duration}>
        <Homepage />
      </Sequence>

      <Sequence from={timing.signup.start} durationInFrames={timing.signup.duration}>
        <Signup />
      </Sequence>

      <Sequence from={timing.dashboard.start} durationInFrames={timing.dashboard.duration}>
        <Dashboard />
      </Sequence>

      <Sequence from={timing.builder.start} durationInFrames={timing.builder.duration}>
        <Builder />
      </Sequence>

      <Sequence from={timing.export.start} durationInFrames={timing.export.duration}>
        <Export />
      </Sequence>

      <Sequence from={timing.outro.start} durationInFrames={timing.outro.duration}>
        <Outro />
      </Sequence>
    </>
  );
};
