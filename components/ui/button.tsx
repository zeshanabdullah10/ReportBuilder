import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ffc8] focus:ring-offset-2 focus:ring-offset-[#0a0f14] disabled:opacity-50 disabled:pointer-events-none',
          {
            // Primary: solid cyan with dark text
            'bg-[#00ffc8] text-[#0a0f14] hover:bg-[#39ff14] hover:shadow-[0_0_20px_rgba(0,255,200,0.4)]': variant === 'primary',
            // Secondary: transparent with cyan border
            'bg-[rgba(0,255,200,0.1)] text-[#00ffc8] border border-[rgba(0,255,200,0.3)] hover:bg-[rgba(0,255,200,0.15)] hover:border-[rgba(0,255,200,0.5)]': variant === 'secondary',
            // Outline: border only
            'border border-[rgba(0,255,200,0.3)] bg-transparent text-[#00ffc8] hover:bg-[rgba(0,255,200,0.05)] hover:border-[rgba(0,255,200,0.5)]': variant === 'outline',
            // Ghost: no border
            'text-[#00ffc8] hover:bg-[rgba(0,255,200,0.1)]': variant === 'ghost',
            // Destructive: red for danger
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'destructive',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
            'p-2': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
