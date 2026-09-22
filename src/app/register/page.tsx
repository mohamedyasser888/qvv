'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import MagicalBackground from '@/components/ui/MagicalBackground'
import MagicalCard from '@/components/ui/MagicalCard'
import MagicalInput from '@/components/ui/MagicalInput'
import MagicalDropdown from '@/components/ui/MagicalDropdown'
import MagicalButton from '@/components/ui/MagicalButton'
import { createClient } from '@/lib/supabase/client'
import { validatePassword, validateMagicalName } from '@/lib/validation'

const houseOptions = [
  { value: 'gryffindor', label: 'Gryffindor', icon: '🦁' },
  { value: 'hufflepuff', label: 'Hufflepuff', icon: '🦡' },
  { value: 'ravenclaw', label: 'Ravenclaw', icon: '🦅' },
  { value: 'slytherin', label: 'Slytherin', icon: '🐍' }
]

export default function RegisterPage() {
  const router = useRouter()
  const [magicalName, setMagicalName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [house, setHouse] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    const nameError = validateMagicalName(magicalName)
    if (nameError) {
      setError(nameError)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!house) {
      setError('Please select your house')
      return
    }

    setLoading(true)

    try {
      // Check if magical name already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('magical_name')
        .eq('magical_name', magicalName.toLowerCase())
        .maybeSingle()

      if (existingProfile) {
        setError('That magical name is already taken.')
        setLoading(false)
        return
      }

      // Create email from magical name using a valid domain
      // Remove spaces and special characters for valid email format
      const sanitizedMagicalName = magicalName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
      const email = `${sanitizedMagicalName}@gmail.com`

      // Sign up with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            magical_name: magicalName.toLowerCase(),
            house: house,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message || 'Registration failed')
        setLoading(false)
        return
      }

      // Check if email confirmation is required
      if (authData?.user && !authData?.session) {
        // We show a magical message and push to a waiting page or home
        // In our magical universe with fake emails, they can't confirm.
        // We will just redirect to home and let the server handle or assume they are in.
        // If they really have email confirm on, they will just see this message.
        setError('Your magical account was created! Check your magical owls (email) for confirmation, if required.')
        setLoading(false)
        return
      }

      // Profile will be created automatically by the trigger
      router.push('/home')
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
            <div className="text-5xl mb-4">✨</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-2">
              Enter the Wizarding World
            </h1>
            <p className="text-slate-400">Begin your magical journey</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <MagicalInput
              type="text"
              placeholder="Magical Name"
              value={magicalName}
              onChange={(e) => setMagicalName(e.target.value)}
              required
            />

            <MagicalInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <MagicalInput
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <MagicalDropdown
              options={houseOptions}
              value={house}
              onChange={setHouse}
              placeholder="Select Your House"
            />

            {error && (
              <div className={`rounded-lg p-3 text-sm ${
                error.includes('created') 
                  ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' 
                  : 'bg-rose-600/20 border-rose-500/50 text-rose-400'
              } border`}>
                {error}
              </div>
            )}

            <MagicalButton
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating your magical account...' : 'Create Magical Account'}
            </MagicalButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Already a wizard?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-amber-400 hover:text-amber-300 font-semibold"
              >
                Enter the Academy
              </button>
            </p>
          </div>
        </MagicalCard>
      </div>
    </MagicalBackground>
  )
}
