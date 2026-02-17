'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary-600" />
              <span className="font-bold text-xl text-slate-900">LabVIEW Report Builder</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-slate-600 hover:text-slate-900">
              Features
            </Link>
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="text-slate-600 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200">
          <div className="px-4 py-4 space-y-3">
            <Link href="#features" className="block text-slate-600 hover:text-slate-900">
              Features
            </Link>
            <Link href="/pricing" className="block text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/login" className="block text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Link href="/signup">
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
