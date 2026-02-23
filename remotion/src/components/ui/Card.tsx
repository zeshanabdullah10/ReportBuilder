import React from 'react';

interface CardProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  width,
  height,
}) => {
  return (
    <div
      style={{
        width,
        height,
        background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.9), rgba(15, 30, 45, 0.8))',
        borderRadius: 12,
        border: '1px solid rgba(0, 255, 200, 0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top glow line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 200, 0.5), transparent)',
        }}
      />
      {children}
    </div>
  );
};
