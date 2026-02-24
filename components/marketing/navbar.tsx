'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Activity, Zap } from 'lucide-react'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f14]/95 backdrop-blur-md border-b border-[rgba(0,255,200,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Animated scope icon */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-[#00ffc8] rounded-lg opacity-30 group-hover:opacity-100 transition-opacity" />
                <Activity className="w-5 h-5 text-[#00ffc8] group-hover:text-[#39ff14] transition-colors" style={{
                  filter: 'drop-shadow(0 0 4px rgba(0, 255, 200, 0.5))'
                }} />
                {/* Signal bars */}
                <div className="absolute -right-1 -top-1 flex gap-0.5">
                  <div className="w-0.5 h-2 bg-[#00ffc8] rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                  <div className="w-0.5 h-3 bg-[#00ffc8] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-0.5 h-1.5 bg-[#00ffc8] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Report Builder
                </span>
                <span className="text-[10px] text-[#00ffc8]/60 font-mono tracking-wider">
                  PRECISION REPORTING
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/login">Sign In</NavLink>
            <div className="ml-4 flex items-center gap-2">
              <Link
                href="/signup"
                className="relative px-5 py-2 font-semibold text-sm text-[#0a0f14] bg-[#00ffc8] rounded overflow-hidden group"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  GET STARTED
                </span>
                <div className="absolute inset-0 bg-[#39ff14] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="text-[#00ffc8] hover:text-[#39ff14] transition-colors p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgba(0,255,200,0.1)] bg-[#0a0f14]">
          <div className="px-4 py-4 space-y-2">
            <MobileNavLink href="#features" onClick={() => setMobileMenuOpen(false)}>Features</MobileNavLink>
            <MobileNavLink href="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</MobileNavLink>
            <MobileNavLink href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</MobileNavLink>
            <Link
              href="/signup"
              className="block w-full mt-4 px-5 py-3 font-semibold text-sm text-[#0a0f14] bg-[#00ffc8] rounded text-center"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              GET STARTED
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative px-4 py-2 text-sm text-gray-400 hover:text-[#00ffc8] transition-colors group"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#00ffc8] group-hover:w-full transition-all duration-300" />
    </Link>
  )
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      className="block py-3 px-4 text-gray-400 hover:text-[#00ffc8] hover:bg-[rgba(0,255,200,0.05)] rounded transition-colors"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
