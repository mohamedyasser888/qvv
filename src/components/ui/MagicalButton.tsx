'use client'

import React from 'react'

interface MagicalButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
  ariaLabel?: string
}

export default function MagicalButton({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false,
  className = '',
  variant = 'primary',
  ariaLabel
}: MagicalButtonProps) {
  const baseStyles = 'relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900'
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-500/30 shadow-lg hover:shadow-amber-500/50 hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-[#0e4a86] to-[#1a472a] hover:from-[#1462ab] hover:to-[#236038] text-white shadow-blue-950/40 shadow-lg hover:shadow-blue-900/60 hover:shadow-xl',
    danger: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-500/30 shadow-lg hover:shadow-rose-500/50 hover:shadow-xl'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 motion-reduce:transition-none" aria-hidden="true" />
      
      <span className="relative z-10">{children}</span>
    </button>
  )
}
