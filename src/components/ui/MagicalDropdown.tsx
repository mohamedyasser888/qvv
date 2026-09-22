'use client'

import React, { useState, useRef, useEffect } from 'react'

interface MagicalDropdownProps {
  options: { value: string; label: string; icon?: string }[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: string
}

export default function MagicalDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  error
}: MagicalDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 bg-slate-900/80 border-2 border-amber-500/30 rounded-xl
          text-white text-left focus:outline-none focus:border-amber-500
          focus:shadow-amber-500/20 focus:shadow-lg transition-all duration-300
          flex items-center justify-between
          ${error ? 'border-rose-500 focus:border-rose-500' : ''}
          ${className}
        `}
      >
        <span className={selectedOption ? 'text-white' : 'text-slate-400'}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon && <span>{selectedOption.icon}</span>}
              {selectedOption.label}
            </span>
          ) : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {error && (
        <p className="mt-1 text-rose-400 text-sm">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500/30 rounded-xl shadow-2xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`
                w-full px-4 py-3 text-left hover:bg-amber-500/20 transition-colors
                flex items-center gap-2
                ${value === option.value ? 'bg-amber-500/30' : ''}
              `}
            >
              {option.icon && <span>{option.icon}</span>}
              <span className="text-white">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
