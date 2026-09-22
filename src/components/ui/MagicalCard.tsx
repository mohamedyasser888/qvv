'use client'

import React, { memo } from 'react'

interface MagicalCardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  overflow?: 'hidden' | 'visible' | 'auto'
}

function MagicalCardComponent({ children, className = '', glow = false, overflow = 'hidden' }: MagicalCardProps) {
  return (
    <div className={`
      relative bg-[linear-gradient(135deg,rgba(116,0,1,0.28),rgba(7,20,32,0.96)_42%,rgba(26,71,42,0.38))]
      backdrop-blur-xl border border-amber-200/30 rounded-2xl
      shadow-2xl overflow-${overflow}
      ${glow ? 'shadow-[0_0_28px_rgba(211,166,37,0.18)]' : ''}
      ${className}
    `}>
      {/* Glowing border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#740001]/20 via-[#d3a625]/10 to-[#1a472a]/20 opacity-70" />
      
      {/* Inner content */}
      <div className="relative z-10 p-6">
        {children}
      </div>

      {/* Magical corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-500/50 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-500/50 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-500/50 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-500/50 rounded-br-xl" />
    </div>
  )
}

// Memoize to prevent re-renders when props don't change
const MagicalCard = memo(MagicalCardComponent)
export default MagicalCard
