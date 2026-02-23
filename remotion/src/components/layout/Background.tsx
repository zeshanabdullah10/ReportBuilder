import React from 'react';
import { AbsoluteFill } from 'remotion';

export const Background: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: '#0a0f14' }}>
    {children}
  </AbsoluteFill>
);
