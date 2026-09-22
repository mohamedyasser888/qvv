'use client'

import React from 'react'
import MagicalCard from './MagicalCard'

interface PositionCardProps {
  position: string
  available: number
  total: number
  onClick: () => void
  disabled?: boolean
  selected?: boolean
}

const positionConfig = {
  keeper: { name: 'Keeper', icon: '🛡️', description: 'Guard the goal posts' },
  chaser: { name: 'Chaser', icon: '⚡', description: 'Score goals with the Quaffle' },
  beater: { name: 'Beater', icon: '🪨', description: 'Hit Bludgers at opponents' },
  seeker: { name: 'Seeker', icon: '🥇', description: 'Catch the Golden Snitch' }
}

export default function PositionCard({ 
  position, 
  available, 
  total, 
  onClick, 
  disabled = false,
  selected = false
}: PositionCardProps) {
  const config = positionConfig[position as keyof typeof positionConfig]
  const isFull = available === 0

  return (
    <MagicalCard 
      className={`
        hover:scale-105 transition-transform duration-300 cursor-pointer
        ${selected ? 'border-amber-500 shadow-amber-500/50' : ''}
        ${isFull ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      glow={selected}
    >
      <div className="text-center">
        <div className="text-4xl mb-3">{config.icon}</div>
        <h3 className="text-xl font-bold text-amber-400 mb-2">{config.name}</h3>
        <p className="text-slate-400 text-sm mb-3">{config.description}</p>
        <div className={`
          px-3 py-1 rounded-full text-sm font-semibold
          ${isFull ? 'bg-rose-600/30 text-rose-400' : 'bg-emerald-600/30 text-emerald-400'}
        `}>
          {available} / {total} available
        </div>
        <button
          onClick={onClick}
          disabled={disabled || isFull}
          className={`
            mt-4 w-full py-2 rounded-lg font-semibold transition-all
            ${disabled || isFull
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white'
            }
          `}
        >
          {isFull ? 'Full' : selected ? 'Selected' : 'Select'}
        </button>
      </div>
    </MagicalCard>
  )
}
