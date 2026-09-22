'use client'

import { useEffect, useState } from 'react'

interface DeviceInfoData {
  screenWidth: number
  screenHeight: number
  devicePixelRatio: number
  touchSupport: boolean
  userAgent: string
  orientation: string
  viewport: { width: number; height: number }
}

/**
 * DeviceInfo component - For testing and debugging mobile devices
 * Shows device information useful for responsive design testing
 * 
 * Usage: Add to any page with ?debug=true query parameter
 */
export default function DeviceInfo() {
  const [info, setInfo] = useState<DeviceInfoData | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show if ?debug=true in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug') !== 'true') return

    setShow(true)

    const updateInfo = () => {
      setInfo({
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        userAgent: navigator.userAgent,
        orientation: window.screen.orientation?.type || 'unknown',
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      })
    }

    updateInfo()
    window.addEventListener('resize', updateInfo)
    window.addEventListener('orientationchange', updateInfo)

    return () => {
      window.removeEventListener('resize', updateInfo)
      window.removeEventListener('orientationchange', updateInfo)
    }
  }, [])

  if (!show || !info) return null

  return (
    <div className="fixed top-0 left-0 z-[9999] max-w-sm bg-black/95 text-white p-3 text-xs font-mono border-r border-b border-amber-500/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-500/30">
        <span className="font-bold text-amber-400">📱 Device Info</span>
        <button
          onClick={() => setShow(false)}
          className="text-slate-400 hover:text-white px-2"
          aria-label="Close device info"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        <div>
          <span className="text-slate-400">Screen:</span>{' '}
          <span className="text-emerald-400">{info.screenWidth} × {info.screenHeight}</span>
        </div>
        
        <div>
          <span className="text-slate-400">Viewport:</span>{' '}
          <span className="text-emerald-400">{info.viewport.width} × {info.viewport.height}</span>
        </div>
        
        <div>
          <span className="text-slate-400">DPR:</span>{' '}
          <span className="text-emerald-400">{info.devicePixelRatio}x</span>
        </div>
        
        <div>
          <span className="text-slate-400">Touch:</span>{' '}
          <span className={info.touchSupport ? 'text-emerald-400' : 'text-red-400'}>
            {info.touchSupport ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="text-slate-400">Orientation:</span>{' '}
          <span className="text-emerald-400">{info.orientation}</span>
        </div>
        
        <div className="pt-2 mt-2 border-t border-amber-500/30">
          <span className="text-slate-400">UA:</span>{' '}
          <div className="text-slate-300 text-[10px] leading-tight mt-1 break-all">
            {info.userAgent}
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-amber-500/30 text-[10px] text-slate-400">
        Remove <code className="text-amber-300">?debug=true</code> to hide
      </div>
    </div>
  )
}
