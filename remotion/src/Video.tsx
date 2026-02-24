import React from 'react';
import { Sequence } from 'remotion';
import {
  Intro,
  Builder,
  Preview,
  Export,
  Output,
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

      <Sequence from={timing.builder.start} durationInFrames={timing.builder.duration}>
        <Builder />
      </Sequence>

      <Sequence from={timing.preview.start} durationInFrames={timing.preview.duration}>
        <Preview />
      </Sequence>

      <Sequence from={timing.export.start} durationInFrames={timing.export.duration}>
        <Export />
      </Sequence>

      <Sequence from={timing.output.start} durationInFrames={timing.output.duration}>
        <Output />
      </Sequence>

      <Sequence from={timing.outro.start} durationInFrames={timing.outro.duration}>
        <Outro />
      </Sequence>
    </>
  );
};
