'use client'

import React from 'react'

interface MagicalInputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  name?: string
  required?: boolean
  className?: string
  error?: string
}

export default function MagicalInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  required = false,
  className = '',
  error
}: MagicalInputProps) {
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        required={required}
        className={`
          w-full px-4 py-3 bg-slate-900/80 border-2 border-amber-500/30 rounded-xl
          text-white placeholder-slate-400 focus:outline-none focus:border-amber-500
          focus:shadow-amber-500/20 focus:shadow-lg transition-all duration-300
          ${error ? 'border-rose-500 focus:border-rose-500' : ''}
          ${className}
        `}
      />
      {error && (
        <p className="mt-1 text-rose-400 text-sm">{error}</p>
      )}
    </div>
  )
}
