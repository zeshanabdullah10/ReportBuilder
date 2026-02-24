import { StatCardSkeleton, TemplateGridSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { FilePlus } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-32 bg-[rgba(0,255,200,0.1)] rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-[rgba(0,255,200,0.1)] rounded animate-pulse" />
        </div>
        <Button className="gap-2" disabled>
          <FilePlus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Templates Section Skeleton */}
      <div>
        <div className="h-6 w-32 bg-[rgba(0,255,200,0.1)] rounded animate-pulse mb-4" />
        <TemplateGridSkeleton count={6} />
      </div>
    </div>
  )
}
