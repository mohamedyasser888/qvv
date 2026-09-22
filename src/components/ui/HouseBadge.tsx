'use client'

import React from 'react'

interface HouseBadgeProps {
  house: 'gryffindor' | 'hufflepuff' | 'ravenclaw' | 'slytherin'
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

const houseConfig = {
  gryffindor: {
    name: 'Gryffindor',
    colors: 'from-red-700 to-amber-600',
    borderColor: 'border-red-500/50',
    icon: '🦁'
  },
  hufflepuff: {
    name: 'Hufflepuff',
    colors: 'from-yellow-600 to-amber-800',
    borderColor: 'border-yellow-500/50',
    icon: '🦡'
  },
  ravenclaw: {
    name: 'Ravenclaw',
    colors: 'from-blue-700 to-slate-400',
    borderColor: 'border-blue-500/50',
    icon: '🦅'
  },
  slytherin: {
    name: 'Slytherin',
    colors: 'from-emerald-700 to-slate-500',
    borderColor: 'border-emerald-500/50',
    icon: '🐍'
  }
}

const sizeConfig = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-2xl'
}

export default function HouseBadge({ house, size = 'md', showName = false }: HouseBadgeProps) {
  const config = houseConfig[house]
  const sizeClass = sizeConfig[size]

  return (
    <div className="flex items-center gap-2">
      <div className={`
        ${sizeClass} rounded-full bg-gradient-to-br ${config.colors}
        border-2 ${config.borderColor} flex items-center justify-center
        shadow-lg
      `}>
        <span className="drop-shadow-md">{config.icon}</span>
      </div>
      {showName && (
        <span className="text-white font-semibold">{config.name}</span>
      )}
    </div>
  )
}
