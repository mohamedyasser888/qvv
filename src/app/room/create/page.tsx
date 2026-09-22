'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MagicalBackground from '@/components/ui/MagicalBackground'
import MagicalCard from '@/components/ui/MagicalCard'
import MagicalNavbar from '@/components/ui/MagicalNavbar'
import MagicalButton from '@/components/ui/MagicalButton'
import LoadingMagic from '@/components/ui/LoadingMagic'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  magical_name: string
  house: 'gryffindor' | 'hufflepuff' | 'ravenclaw' | 'slytherin'
}

function CreateRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSolo = searchParams.get('solo') === 'true'
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- initial page load only

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }
    } catch {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'QUID-'
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleCreateRoom = async () => {
    if (!profile) return

    setCreating(true)
    setError('')

    try {
      const code = generateRoomCode()
      
      // Create room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          room_code: code,
          mode: isSolo ? 'solo' : 'team',
          creator_id: profile.id,
          status: 'waiting'
        })
        .select()
        .single()

      if (roomError) {
        console.error('Room creation error:', roomError)
        setError(`Failed to create room: ${roomError.message}`)
        setCreating(false)
        return
      }

      // Create two teams
      const { error: teamsError } = await supabase
        .from('teams')
        .insert([
          {
            room_id: roomData.id,
            team_number: 1,
            captain_id: profile.id,
            ready: false
          },
          {
            room_id: roomData.id,
            team_number: 2,
            captain_id: null,
            ready: false
          }
        ])

      if (teamsError) {
        setError('Failed to create teams. Please try again.')
        setCreating(false)
        return
      }

      // Add creator to Team 1
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('room_id', roomData.id)
        .eq('team_number', 1)
        .single()

      if (isSolo && teamData) {
        // In solo mode, creator controls all 7 positions
        // We'll add them as a team member with a special position indicator
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamData.id,
            user_id: profile.id,
            position: 'keeper', // Primary position
            confirmed: true
          })

        if (memberError) {
          setError('Failed to join team. Please try again.')
          setCreating(false)
          return
        }
      }

      router.push(`/room/${code}`)
    } catch {
      setError('A magical disturbance occurred. Please try again.')
      setCreating(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <LoadingMagic />
  }

  if (!profile) {
    return null
  }

  return (
    <MagicalBackground>
      <MagicalNavbar
        magicalName={profile.magical_name}
        house={profile.house}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-2">
              Create Quidditch Room
            </h1>
            <p className="text-slate-400">
              {isSolo ? 'Solo Mode: Control all 7 positions' : 'Team Mode: 7 players per team'}
            </p>
          </div>

          <MagicalCard glow>
            <div className="space-y-6">
              <div>
                <label className="block text-amber-400 font-semibold mb-2">
                  Mode
                </label>
                <div className="text-2xl font-bold text-white">
                  {isSolo ? '🧙‍♂️ SOLO' : '👥 TEAM'}
                </div>
              </div>

              {error && (
                <div className="bg-rose-600/20 border border-rose-500/50 rounded-lg p-3 text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <MagicalButton
                onClick={handleCreateRoom}
                disabled={creating}
                className="w-full"
              >
                {creating ? 'Creating Room...' : 'Create Room'}
              </MagicalButton>

              <button
                onClick={() => router.push('/play')}
                className="w-full py-3 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </MagicalCard>

          <div className="mt-8">
            <button
              onClick={() => router.push('/room/join')}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold transition-all"
            >
              Join Existing Room
            </button>
          </div>
        </div>
      </div>
    </MagicalBackground>
  )
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={<LoadingMagic />}>
      <CreateRoomContent />
    </Suspense>
  )
}
