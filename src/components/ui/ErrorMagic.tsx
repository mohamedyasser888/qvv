'use client'

import React from 'react'

interface ErrorMagicProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMagic({ message, onRetry }: ErrorMagicProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" role="alert" aria-live="assertive">
      <div className="text-6xl mb-4" aria-hidden="true">🔮</div>
      <div className="bg-gradient-to-br from-slate-900/90 to-purple-950/90 backdrop-blur-xl border-2 border-rose-500/30 rounded-2xl p-8 max-w-md text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-rose-400 mb-4">Magical Mishap</h2>
        <p className="text-slate-300 mb-6">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Retry the failed action"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
