'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import MagicalBackground from '@/components/ui/MagicalBackground'
import MagicalCard from '@/components/ui/MagicalCard'
import MagicalInput from '@/components/ui/MagicalInput'
import MagicalButton from '@/components/ui/MagicalButton'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [magicalName, setMagicalName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          magicalName,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update password. Please try again.')
        setLoading(false)
        return
      }

      setMessage('Password updated successfully! You can now login with your new password.')
      setLoading(false)
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setError('A magical disturbance occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <MagicalBackground>
      <div className="min-h-screen flex items-center justify-center p-4 overflow-visible">
        <MagicalCard className="w-full max-w-md" overflow="visible">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔮</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-2">
              Reset Password
            </h1>
            <p className="text-slate-400">Enter your magical name and new password</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <MagicalInput
              type="text"
              placeholder="Magical Name"
              value={magicalName}
              onChange={(e) => setMagicalName(e.target.value)}
              required
            />

            <MagicalInput
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <MagicalInput
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && (
              <div className="bg-rose-600/20 border border-rose-500/50 rounded-lg p-3 text-rose-400 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-emerald-600/20 border border-emerald-500/50 rounded-lg p-3 text-emerald-400 text-sm">
                {message}
              </div>
            )}

            <MagicalButton
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Password'}
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
