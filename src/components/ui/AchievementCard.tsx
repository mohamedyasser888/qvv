'use client'

import React from 'react'
import MagicalCard from './MagicalCard'

interface AchievementCardProps {
  name: string
  description: string
  icon: string
  unlocked: boolean
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  progress?: string
}

const rarityConfig = {
  common: { colors: 'from-slate-600 to-slate-700', border: 'border-slate-500/50' },
  rare: { colors: 'from-blue-600 to-blue-700', border: 'border-blue-500/50' },
  epic: { colors: 'from-purple-600 to-purple-700', border: 'border-purple-500/50' },
  legendary: { colors: 'from-amber-500 to-amber-600', border: 'border-amber-500/50' }
}

export default function AchievementCard({ 
  name, 
  description, 
  icon, 
  unlocked, 
  rarity = 'common',
  progress
}: AchievementCardProps) {
  return (
    <MagicalCard 
      className={`
        ${unlocked ? 'opacity-100' : 'opacity-50'}
        ${unlocked ? `shadow-amber-500/30 ${rarityConfig[rarity].border}` : ''}
      `}
      glow={unlocked}
    >
      <div className="text-center">
        <div className={`
          text-4xl mb-3 ${unlocked ? 'animate-pulse' : 'grayscale'}
        `}>
          {unlocked ? icon : '🔒'}
        </div>
        <h3 className={`
          text-lg font-bold mb-2
          ${unlocked ? 'text-amber-400' : 'text-slate-500'}
        `}>
          {name.toUpperCase()}
        </h3>
        <p className="text-slate-400 text-sm mb-3">{description}</p>
        {progress && (
          <div className="text-xs text-slate-500 mb-2">{progress}</div>
        )}
        <div className={`
          px-3 py-1 rounded-full text-xs font-semibold
          ${unlocked 
            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white' 
            : 'bg-slate-700 text-slate-500'
          }
        `}>
          {unlocked ? 'UNLOCKED' : 'LOCKED'}
        </div>
      </div>
    </MagicalCard>
  )
}
