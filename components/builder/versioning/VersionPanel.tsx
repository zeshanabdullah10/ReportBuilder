'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, History, Loader2, AlertCircle } from 'lucide-react'
import { VersionItem } from './VersionItem'

interface TemplateVersion {
  id: string
  version_number: number
  change_description: string | null
  created_by: string | null
  created_at: string
}

interface VersionPanelProps {
  templateId: string
  isOpen: boolean
  onClose: () => void
  onVersionRestored: () => void
}

export function VersionPanel({
  templateId,
  isOpen,
  onClose,
  onVersionRestored,
}: VersionPanelProps) {
  const [versions, setVersions] = useState<TemplateVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)
  const [currentVersion, setCurrentVersion] = useState<number>(0)

  // Fetch versions when panel opens
  const fetchVersions = useCallback(async () => {
    if (!isOpen || !templateId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/templates/${templateId}/versions`)

      if (!response.ok) {
        throw new Error('Failed to load version history')
      }

      const data = await response.json()
      setVersions(data.versions || [])
      
      // Current version is the highest version number
      if (data.versions && data.versions.length > 0) {
        setCurrentVersion(Math.max(...data.versions.map((v: TemplateVersion) => v.version_number)))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, templateId])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  // Handle restore
  const handleRestore = async (versionNumber: number) => {
    setRestoringVersion(versionNumber)
    setError(null)

    try {
      const response = await fetch(
        `/api/templates/${templateId}/versions/${versionNumber}/restore`,
        { method: 'POST' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to restore version')
      }

      // Refresh versions after restore
      await fetchVersions()
      
      // Notify parent to reload the template
      onVersionRestored()
      
      // Close the panel
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version')
    } finally {
      setRestoringVersion(null)
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-[#0a0f14] border-l border-[rgba(0,255,200,0.1)] z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,255,200,0.1)]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#00ffc8]" />
            <h2 className="text-lg font-semibold text-white">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#00ffc8] animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No version history yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Versions are created automatically when you save changes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">
                {versions.length} version{versions.length !== 1 ? 's' : ''} saved.
                Restoring will create a new version with the previous state.
              </p>
              
              {versions.map((version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isCurrentVersion={version.version_number === currentVersion}
                  onRestore={handleRestore}
                  isRestoring={restoringVersion === version.version_number}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(0,255,200,0.1)]">
          <p className="text-xs text-gray-500 text-center">
            Versions are automatically created when you save changes to your template.
          </p>
        </div>
      </div>
    </>
  )
}
