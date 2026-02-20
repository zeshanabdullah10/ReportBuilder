'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Link2, Copy, Check, Mail, Lock, Calendar, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Share {
  id: string
  share_type: 'link' | 'user'
  share_token: string | null
  shared_with_email: string | null
  permission: 'view' | 'edit'
  expires_at: string | null
  created_at: string
  last_accessed_at: string | null
}

interface ShareDialogProps {
  templateId: string
  templateName: string
  isOpen: boolean
  onClose: () => void
}

export function ShareDialog({
  templateId,
  templateName,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const [shares, setShares] = useState<Share[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  
  // New share form state
  const [newShareType, setNewShareType] = useState<'link' | 'user'>('link')
  const [newEmail, setNewEmail] = useState('')
  const [newPermission, setNewPermission] = useState<'view' | 'edit'>('view')
  const [newPassword, setNewPassword] = useState('')
  const [newExpiration, setNewExpiration] = useState('')

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // Fetch existing shares
  const fetchShares = useCallback(async () => {
    if (!isOpen || !templateId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/templates/${templateId}/shares`)

      if (!response.ok) {
        throw new Error('Failed to load shares')
      }

      const data = await response.json()
      setShares(data.shares || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, templateId])

  useEffect(() => {
    fetchShares()
  }, [fetchShares])

  // Copy share link to clipboard
  const copyShareLink = async (token: string) => {
    const shareUrl = `${appUrl}/shared/${token}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Create new share
  const handleCreateShare = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {
        share_type: newShareType,
        permission: newPermission,
      }

      if (newShareType === 'user') {
        body.shared_with_email = newEmail
      }

      if (newPassword) {
        body.password = newPassword
      }

      if (newExpiration) {
        body.expires_at = new Date(newExpiration).toISOString()
      }

      const response = await fetch(`/api/templates/${templateId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create share')
      }

      // Reset form
      setNewEmail('')
      setNewPassword('')
      setNewExpiration('')
      setNewShareType('link')
      
      // Refresh shares
      await fetchShares()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  // Delete share
  const handleDeleteShare = async (shareId: string) => {
    try {
      const response = await fetch(
        `/api/templates/${templateId}/shares?share_id=${shareId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete share')
      }

      // Refresh shares
      await fetchShares()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[rgba(0,255,200,0.1)]">
            <h2 className="text-lg font-semibold text-white">
              Share: {templateName}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Create new share */}
            <div className="mb-6 p-4 rounded-lg bg-[#050810] border border-[rgba(0,255,200,0.1)]">
              <h3 className="text-sm font-medium text-white mb-3">Create New Share</h3>
              
              {/* Share type toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setNewShareType('link')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    newShareType === 'link'
                      ? 'bg-[#00ffc8] text-[#0a0f14]'
                      : 'bg-[#0a0f14] text-gray-400 border border-[rgba(0,255,200,0.2)]'
                  }`}
                >
                  <Link2 className="w-4 h-4 inline mr-2" />
                  Share Link
                </button>
                <button
                  onClick={() => setNewShareType('user')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    newShareType === 'user'
                      ? 'bg-[#00ffc8] text-[#0a0f14]'
                      : 'bg-[#0a0f14] text-gray-400 border border-[rgba(0,255,200,0.2)]'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Invite Email
                </button>
              </div>

              {/* Email input for user sharing */}
              {newShareType === 'user' && (
                <div className="mb-3">
                  <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full px-3 py-2 bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffc8]"
                  />
                </div>
              )}

              {/* Permission */}
              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1">Permission</label>
                <select
                  value={newPermission}
                  onChange={(e) => setNewPermission(e.target.value as 'view' | 'edit')}
                  className="w-full px-3 py-2 bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00ffc8]"
                >
                  <option value="view">View only</option>
                  <option value="edit">Can edit</option>
                </select>
              </div>

              {/* Optional password */}
              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Password (optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty for no password"
                  className="w-full px-3 py-2 bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              {/* Optional expiration */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Expiration (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newExpiration}
                  onChange={(e) => setNewExpiration(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00ffc8]"
                />
              </div>

              <Button
                onClick={handleCreateShare}
                disabled={isCreating || (newShareType === 'user' && !newEmail)}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Create Share
                  </>
                )}
              </Button>
            </div>

            {/* Existing shares */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Active Shares</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#00ffc8] animate-spin" />
                </div>
              ) : shares.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No active shares. Create one above to share this template.
                </p>
              ) : (
                <div className="space-y-2">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="p-3 rounded-lg bg-[#050810] border border-[rgba(0,255,200,0.1)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {share.share_type === 'link' && share.share_token && (
                            <div className="flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-[#00ffc8] flex-shrink-0" />
                              <code className="text-xs text-gray-400 truncate flex-1">
                                {appUrl}/shared/{share.share_token}
                              </code>
                              <button
                                onClick={() => copyShareLink(share.share_token!)}
                                className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                              >
                                {copiedToken === share.share_token ? (
                                  <Check className="w-4 h-4 text-[#39ff14]" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          )}
                          
                          {share.share_type === 'user' && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-[#00ffc8]" />
                              <span className="text-sm text-white">{share.shared_with_email}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className={`px-2 py-0.5 rounded ${
                              share.permission === 'edit'
                                ? 'bg-[#ffb000]/20 text-[#ffb000]'
                                : 'bg-[#00ffc8]/20 text-[#00ffc8]'
                            }`}>
                              {share.permission === 'edit' ? 'Can edit' : 'View only'}
                            </span>
                            {share.expires_at && (
                              <span>
                                Expires: {new Date(share.expires_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteShare(share.id)}
                          className="p-1 rounded hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[rgba(0,255,200,0.1)]">
            <Button variant="outline" onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
