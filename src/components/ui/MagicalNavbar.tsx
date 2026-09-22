'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import HouseBadge from './HouseBadge'

interface MagicalNavbarProps {
  magicalName?: string
  house?: 'gryffindor' | 'hufflepuff' | 'ravenclaw' | 'slytherin'
  onLogout?: () => void
}

export default function MagicalNavbar({ magicalName, house, onLogout }: MagicalNavbarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/home', label: '🏠 Home', icon: '🏠' },
    { href: '/achievements', label: '🏆 Achievements', icon: '🏆' },
    { href: '/play', label: '⚡ Play', icon: '⚡' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-amber-300/40 bg-[linear-gradient(90deg,rgba(116,0,1,0.94),rgba(10,20,35,0.97)_25%,rgba(10,20,35,0.97)_75%,rgba(26,71,42,0.94))] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2">
            <span className="text-2xl">🧹</span>
            <span className="text-xl font-black tracking-wide bg-gradient-to-r from-amber-100 via-[#d3a625] to-amber-100 bg-clip-text text-transparent">
              Quidditch Academy
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-300
                  ${pathname === item.href
                    ? 'bg-[#d3a625]/20 text-amber-100 border border-[#d3a625]/60'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User info */}
          <div className="flex items-center gap-4">
            {magicalName && house && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-white font-semibold">{magicalName}</p>
                  <HouseBadge house={house} size="sm" />
                </div>
              </div>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 hover:text-rose-300 rounded-lg font-medium transition-all duration-300 border border-rose-500/30"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
