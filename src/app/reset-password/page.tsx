'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MagicalBackground from '@/components/ui/MagicalBackground'
import MagicalCard from '@/components/ui/MagicalCard'
import MagicalInput from '@/components/ui/MagicalInput'
import MagicalButton from '@/components/ui/MagicalButton'
import LoadingMagic from '@/components/ui/LoadingMagic'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordContent() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    checkSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- session check is evaluated once on mount

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        setError('Invalid or expired reset link. Please request a new password reset.')
        setLoading(false)
        return
      }

      setLoading(false)
    } catch {
      setError('A magical disturbance occurred.')
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setResetting(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        setError('Failed to update password. Please try again.')
        setResetting(false)
        return
      }

      router.push('/login')
    } catch {
      setError('A magical disturbance occurred.')
      setResetting(false)
    }
  }

  if (loading) {
    return <LoadingMagic />
  }

  return (
    <MagicalBackground>
      <div className="min-h-screen flex items-center justify-center p-4 overflow-visible">
        <MagicalCard className="w-full max-w-md" overflow="visible">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">✨</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-2">
              Reset Password
            </h1>
            <p className="text-slate-400">Enter your new password</p>
          </div>

          {error && (
            <div className="bg-rose-600/20 border border-rose-500/50 rounded-lg p-3 text-rose-400 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            <MagicalInput
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <MagicalInput
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <MagicalButton
              type="submit"
              disabled={resetting}
              className="w-full"
            >
              {resetting ? 'Updating...' : 'Update Password'}
            </MagicalButton>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              Back to Login
            </button>
          </div>
        </MagicalCard>
      </div>
    </MagicalBackground>
  )
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<LoadingMagic />}>
      <ResetPasswordContent />
    </React.Suspense>
  )
}
