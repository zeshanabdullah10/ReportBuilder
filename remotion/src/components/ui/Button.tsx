import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    border: 'none',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#00ffc8',
      color: '#0a0f14',
    },
    secondary: {
      backgroundColor: 'rgba(0, 255, 200, 0.1)',
      color: '#00ffc8',
      border: '1px solid rgba(0, 255, 200, 0.3)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#00ffc8',
      border: '1px solid rgba(0, 255, 200, 0.3)',
    },
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 14 },
    lg: { padding: '12px 24px', fontSize: 16 },
  };

  return (
    <button style={{ ...baseStyle, ...variants[variant], ...sizes[size] }}>
      {children}
    </button>
  );
};
