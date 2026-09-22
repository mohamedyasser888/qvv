'use client'

import React, { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export default function ToastNotification({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeStyles = {
    success: 'bg-emerald-600/90 border-emerald-500/50',
    error: 'bg-rose-600/90 border-rose-500/50',
    info: 'bg-blue-600/90 border-blue-500/50'
  }

  const icons = {
    success: '✨',
    error: '⚠️',
    info: 'ℹ️'
  }

  const typeLabels = {
    success: 'Success',
    error: 'Error',
    info: 'Information'
  }

  return (
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
      className={`
        fixed top-4 right-4 z-50 px-6 py-4 rounded-xl border-2 backdrop-blur-xl
        text-white font-medium shadow-2xl transition-all duration-300 motion-reduce:transition-none
        ${typeStyles[type]}
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl" aria-hidden="true">{icons[type]}</span>
        <span>
          <span className="sr-only">{typeLabels[type]}: </span>
          {message}
        </span>
      </div>
    </div>
  )
}
