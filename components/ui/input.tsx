import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[rgba(0,255,200,0.2)] bg-[#050810] px-3 py-2 text-sm text-white placeholder:text-gray-500 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[#00ffc8] focus:border-[#00ffc8]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
