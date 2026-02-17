'use client'

import { useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  templateName: string
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({
  isOpen,
  templateName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel()
      }
    },
    [isDeleting, onCancel]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-xl p-6 max-w-md w-full mx-4 shadow-[0_0_40px_rgba(0,255,200,0.1)]">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>

        {/* Title */}
        <h3
          className="text-lg font-semibold text-white text-center mb-2"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Delete Template
        </h3>

        {/* Message */}
        <p className="text-gray-400 text-center mb-2">
          Are you sure you want to delete this template?
        </p>

        {/* Template Name */}
        <p className="text-[#00ffc8] text-center font-medium mb-6 truncate">
          &quot;{templateName}&quot;
        </p>

        {/* Warning */}
        <p className="text-red-400/80 text-sm text-center mb-6">
          This action cannot be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
