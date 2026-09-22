'use client'

import React from 'react'

export default function MagicalBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-visible bg-[#071420]">
      {/* Hogwarts house banners and a moonlit Quidditch-pitch glow. */}
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#740001] via-[#d3a625] via-[#0e4a86] to-[#1a472a]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_120%,rgba(26,71,42,0.72),transparent_52%),radial-gradient(circle_at_14%_18%,rgba(116,0,1,0.38),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(14,74,134,0.38),transparent_30%)]" />
      <div className="absolute inset-x-[9%] top-[12%] bottom-[8%] rounded-[50%] border border-amber-300/10 pointer-events-none" />
      <div className="absolute inset-x-[18%] top-[21%] bottom-[16%] rounded-[50%] border border-white/5 pointer-events-none" />
      {/* Magical particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-400 rounded-full animate-pulse opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-300 rounded-full animate-pulse opacity-40" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-emerald-400 rounded-full animate-pulse opacity-30" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-rose-400 rounded-full animate-pulse opacity-50" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-1/3 right-1/2 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 left-1/2 w-2 h-2 bg-amber-300 rounded-full animate-pulse opacity-35" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* Fog effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/70 via-transparent to-[#030712]/30 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
