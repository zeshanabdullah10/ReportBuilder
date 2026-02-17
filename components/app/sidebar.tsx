'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { FileText, LayoutDashboard, FilePlus, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'New Template', href: '/dashboard/new', icon: FilePlus },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <div className="flex flex-col h-full w-64 bg-[#050810] text-white border-r border-[rgba(0,255,200,0.1)] relative z-20">
      {/* Logo section */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[rgba(0,255,200,0.1)]">
        <div className="relative">
          <div className="absolute inset-0 bg-[#00ffc8] blur-lg opacity-50" />
          <FileText className="relative h-8 w-8 text-[#00ffc8]" />
        </div>
        <div className="flex flex-col">
          <span
            className="font-bold text-lg text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Report Builder
          </span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39ff14] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39ff14]" />
            </span>
            <span className="text-xs text-[#00ffc8]/60 font-mono">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[rgba(0,255,200,0.15)] text-[#00ffc8] border-l-2 border-[#00ffc8]'
                  : 'text-gray-400 hover:bg-[rgba(0,255,200,0.05)] hover:text-[#00ffc8]'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-[rgba(0,255,200,0.1)]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[rgba(0,255,200,0.2)] border border-[rgba(0,255,200,0.3)] flex items-center justify-center">
            <span className="text-sm font-medium text-[#00ffc8]">
              {user?.email?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{user?.email}</p>
            <p className="text-xs text-gray-500">Free Plan</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 mt-2 text-sm text-gray-400 hover:text-[#00ffc8] hover:bg-[rgba(0,255,200,0.05)] rounded-lg transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
