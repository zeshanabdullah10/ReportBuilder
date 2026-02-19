import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

/**
 * Skeleton loading component for displaying placeholder content
 * while data is being fetched.
 * 
 * @example
 * // Basic usage
 * <Skeleton className="h-4 w-full" />
 * 
 * // Card skeleton
 * <Skeleton variant="rectangular" className="h-40 w-full" />
 * 
 * // Avatar skeleton
 * <Skeleton variant="circular" className="h-10 w-10" />
 */
export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-[rgba(0,255,200,0.1)]',
        {
          // Variants
          'rounded': variant === 'rectangular',
          'rounded-full': variant === 'circular',
          'rounded h-4': variant === 'text',
          // Animations
          'animate-pulse': animation === 'pulse',
          'skeleton-wave': animation === 'wave',
        },
        className
      )}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  )
}

/**
 * Skeleton for a template card in the dashboard
 */
export function TemplateCardSkeleton() {
  return (
    <div className="rounded-lg border border-[rgba(0,255,200,0.1)] bg-[#0a0f14] overflow-hidden">
      {/* Preview area */}
      <Skeleton className="h-40 w-full" />
      
      {/* Content area */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton grid for the dashboard template list
 */
export function TemplateGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <TemplateCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for dashboard stats cards
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-[rgba(0,255,200,0.1)] bg-gradient-to-b from-[#0a0f14] to-[#050810] p-6">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

/**
 * Skeleton for the builder canvas while loading
 */
export function BuilderCanvasSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-[#0a0f14]">
      {/* Topbar skeleton */}
      <div className="h-14 border-b border-[rgba(0,255,200,0.1)] bg-[#050810] flex items-center px-4 gap-4">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar skeleton */}
        <div className="w-64 border-r border-[rgba(0,255,200,0.1)] bg-[#050810] p-4 space-y-4">
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8" variant="rectangular" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        
        {/* Canvas skeleton */}
        <div className="flex-1 p-8 flex justify-center">
          <Skeleton className="h-[800px] w-[600px]" />
        </div>
        
        {/* Right sidebar skeleton */}
        <div className="w-72 border-l border-[rgba(0,255,200,0.1)] bg-[#050810] p-4 space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for export modal
 */
export function ExportModalSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-6 w-32" />
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-48" />
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-48" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-12 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-12 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
