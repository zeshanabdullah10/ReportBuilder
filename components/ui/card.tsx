import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-br from-[rgba(10,20,30,0.9)] to-[rgba(15,30,45,0.8)] border border-[rgba(0,255,200,0.15)] shadow-lg relative overflow-hidden transition-all duration-300 hover:border-[rgba(0,255,200,0.3)] hover:shadow-[0_0_30px_rgba(0,255,200,0.1)]',
        // Top glow line on hover
        'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[rgba(0,255,200,0.5)] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: CardProps) {
  return (
    <p
      className={cn('text-sm text-gray-400', className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
}
