'use client'

import React from 'react'
import MagicalCard from './MagicalCard'
import MagicalButton from './MagicalButton'

interface RoomCardProps {
  title: string
  description: string
  icon: string
  onClick: () => void
  disabled?: boolean
}

export default function RoomCard({ title, description, icon, onClick, disabled = false }: RoomCardProps) {
  return (
    <MagicalCard 
      className="hover:scale-105 transition-transform duration-300 cursor-pointer"
      glow
    >
      <div className="text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-2xl font-bold text-amber-400 mb-2">{title}</h3>
        <p className="text-slate-300 mb-6">{description}</p>
        <MagicalButton onClick={onClick} disabled={disabled} className="w-full">
          {title}
        </MagicalButton>
      </div>
    </MagicalCard>
  )
}
