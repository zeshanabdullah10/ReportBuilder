'use client'

import { Clock, RotateCcw, User } from 'lucide-react'

// Simple date formatting utility
function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString()
}

interface VersionItemProps {
  version: {
    id: string
    version_number: number
    change_description: string | null
    created_by: string | null
    created_at: string
  }
  isCurrentVersion: boolean
  onRestore: (versionNumber: number) => void
  isRestoring: boolean
}

export function VersionItem({
  version,
  isCurrentVersion,
  onRestore,
  isRestoring,
}: VersionItemProps) {
  const timeAgo = formatDistanceToNow(new Date(version.created_at))

  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        isCurrentVersion
          ? 'bg-[#00ffc8]/10 border-[#00ffc8]/30'
          : 'bg-[#050810] border-[rgba(0,255,200,0.1)] hover:border-[rgba(0,255,200,0.2)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-[#00ffc8]">
              v{version.version_number}
            </span>
            {isCurrentVersion && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#00ffc8]/20 text-[#00ffc8]">
                Current
              </span>
            )}
          </div>

          {version.change_description && (
            <p className="text-sm text-gray-300 mb-2 line-clamp-2">
              {version.change_description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{timeAgo} ago</span>
            </div>
            {version.created_by && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Auto-saved</span>
              </div>
            )}
          </div>
        </div>

        {!isCurrentVersion && (
          <button
            onClick={() => onRestore(version.version_number)}
            disabled={isRestoring}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] text-gray-300 hover:text-[#00ffc8] hover:border-[rgba(0,255,200,0.4)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3 h-3" />
            {isRestoring ? 'Restoring...' : 'Restore'}
          </button>
        )}
      </div>
    </div>
  )
}
