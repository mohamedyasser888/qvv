'use client'

import React from 'react'

interface KeyboardHintProps {
  keys: string[]
  action: string
  className?: string
}

/**
 * KeyboardHint component
 * Shows keyboard shortcuts to users
 */
export default function KeyboardHint({ keys, action, className = '' }: KeyboardHintProps) {
  return (
    <div 
      className={`flex items-center gap-2 text-xs text-slate-400 ${className}`}
      role="note"
      aria-label={`Keyboard shortcut: ${keys.join(' + ')} to ${action}`}
    >
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && <span className="text-slate-600">+</span>}
          <kbd className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 font-mono text-slate-300 shadow-sm">
            {key}
          </kbd>
        </React.Fragment>
      ))}
      <span className="ml-1">{action}</span>
    </div>
  )
}

/**
 * KeyboardHintGroup component
 * Shows multiple keyboard hints grouped together
 */
export function KeyboardHintGroup({ hints, className = '' }: { hints: Array<{ keys: string[]; action: string }>; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`} role="complementary" aria-label="Keyboard shortcuts">
      {hints.map((hint, index) => (
        <KeyboardHint key={index} keys={hint.keys} action={hint.action} />
      ))}
    </div>
  )
}
