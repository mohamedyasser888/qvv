'use client'

import React from 'react'
import HouseBadge from './HouseBadge'

interface PlayerAvatarProps {
  magicalName: string
  house: 'gryffindor' | 'hufflepuff' | 'ravenclaw' | 'slytherin'
  size?: 'sm' | 'md' | 'lg'
  showCaptain?: boolean
}

export default function PlayerAvatar({ magicalName, house, size = 'md', showCaptain = false }: PlayerAvatarProps) {
  const sizeConfig = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`
        ${sizeConfig[size]} rounded-full bg-gradient-to-br from-slate-800 to-slate-900
        border-2 border-amber-500/50 flex items-center justify-center
        shadow-lg overflow-hidden
      `}>
        <span className="text-2xl font-bold text-amber-400">
          {magicalName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">{magicalName}</span>
          {showCaptain && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-black rounded-full">
              CAPTAIN
            </span>
          )}
        </div>
        <HouseBadge house={house} size="sm" />
      </div>
    </div>
  )
}
