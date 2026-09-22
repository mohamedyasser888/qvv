'use client'

import React from 'react'

interface LoadingSkeletonProps {
  variant?: 'profile' | 'room' | 'card' | 'list' | 'full'
}

export default function LoadingSkeleton({ variant = 'full' }: LoadingSkeletonProps) {
  if (variant === 'full') {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite" aria-label="Loading content">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-500/30 rounded-full animate-spin motion-reduce:animate-none" />
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-amber-500 rounded-full animate-spin motion-reduce:animate-none" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse motion-reduce:animate-none" aria-hidden="true">✨</span>
          </div>
        </div>
        <span className="sr-only">Loading magical content, please wait...</span>
      </div>
    )
  }

  if (variant === 'profile') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse" role="status" aria-label="Loading profile">
        {/* Welcome Section Skeleton */}
        <div className="mb-8 rounded-3xl border border-amber-200/20 bg-[#091321]/75 px-6 py-7">
          <div className="h-3 w-48 bg-amber-500/20 rounded mb-3" />
          <div className="h-10 w-96 bg-gradient-to-r from-amber-500/20 to-amber-500/10 rounded mb-2" />
          <div className="h-5 w-72 bg-slate-700/50 rounded" />
        </div>

        {/* Tab Skeleton */}
        <div className="mb-8 flex w-fit rounded-xl border border-white/10 bg-slate-900/70 p-1">
          <div className="h-10 w-28 bg-slate-700/50 rounded-lg" />
          <div className="h-10 w-32 bg-slate-700/30 rounded-lg ml-1" />
        </div>

        {/* Profile Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-amber-200/20 bg-[#091321]/75 p-6 backdrop-blur-sm">
              <div className="h-6 w-32 bg-amber-500/20 rounded mb-4" />
              <div className="h-20 bg-slate-700/30 rounded mb-3" />
              <div className="h-4 w-24 bg-slate-700/30 rounded" />
            </div>
          ))}
        </div>

        {/* Recent Achievements Skeleton */}
        <div className="rounded-2xl border border-amber-200/20 bg-[#091321]/75 p-6 backdrop-blur-sm">
          <div className="h-8 w-48 bg-amber-500/20 rounded mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center p-4 bg-slate-800/50 rounded-xl">
                <div className="w-12 h-12 bg-slate-700/50 rounded-full mx-auto mb-2" />
                <div className="h-4 w-20 bg-slate-700/30 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only">Loading profile, please wait...</span>
      </div>
    )
  }

  if (variant === 'room') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse" role="status" aria-label="Loading room">
        {/* Room Header Skeleton */}
        <div className="mb-8 rounded-3xl border border-amber-200/20 bg-[#091321]/75 px-6 py-7">
          <div className="h-10 w-64 bg-gradient-to-r from-amber-500/20 to-amber-500/10 rounded mb-2" />
          <div className="h-5 w-40 bg-slate-700/50 rounded" />
        </div>

        {/* Teams Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-amber-200/20 bg-[#091321]/75 p-6 backdrop-blur-sm">
              <div className="h-8 w-32 bg-amber-500/20 rounded mb-6" />
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-12 h-12 bg-slate-700/50 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-slate-700/30 rounded mb-2" />
                      <div className="h-3 w-24 bg-slate-700/20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <span className="sr-only">Loading room, please wait...</span>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className="rounded-2xl border border-amber-200/20 bg-[#091321]/75 p-6 backdrop-blur-sm animate-pulse" role="status" aria-label="Loading">
        <div className="h-6 w-32 bg-amber-500/20 rounded mb-4" />
        <div className="h-20 bg-slate-700/30 rounded mb-3" />
        <div className="h-4 w-24 bg-slate-700/30 rounded" />
        <span className="sr-only">Loading content, please wait...</span>
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4 animate-pulse" role="status" aria-label="Loading list">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-amber-200/20 bg-[#091321]/75 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full" />
              <div className="flex-1">
                <div className="h-5 w-48 bg-slate-700/30 rounded mb-2" />
                <div className="h-4 w-32 bg-slate-700/20 rounded" />
              </div>
              <div className="h-10 w-24 bg-amber-500/20 rounded" />
            </div>
          </div>
        ))}
        <span className="sr-only">Loading list, please wait...</span>
      </div>
    )
  }

  return null
}
