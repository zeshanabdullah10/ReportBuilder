'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Zap, Loader2 } from 'lucide-react'

interface CreditBalanceProps {
  showBuyButton?: boolean
  onBuyCredits?: () => void
}

export function CreditBalance({ showBuyButton = true, onBuyCredits }: CreditBalanceProps) {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/billing/credits')
      if (response.ok) {
        const data = await response.json()
        setCredits(data.credits)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#00ffc8]" />
        <span className="text-sm text-gray-300">
          <span className="text-white font-semibold">{credits ?? 0}</span> exports
        </span>
      </div>
      {showBuyButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={onBuyCredits}
          className="text-xs"
        >
          Buy Credits
        </Button>
      )}
    </div>
  )
}
