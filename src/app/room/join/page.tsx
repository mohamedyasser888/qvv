'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MagicalBackground from '@/components/ui/MagicalBackground'
import MagicalCard from '@/components/ui/MagicalCard'
import MagicalNavbar from '@/components/ui/MagicalNavbar'
import MagicalButton from '@/components/ui/MagicalButton'
import MagicalInput from '@/components/ui/MagicalInput'
import LoadingMagic from '@/components/ui/LoadingMagic'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  magical_name: string
  house: 'gryffindor' | 'hufflepuff' | 'ravenclaw' | 'slytherin'
}

export default function JoinRoomPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
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

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !roomCode.trim()) return

    setJoining(true)
    setError('')

    try {
      const cleanRoomCode = roomCode.trim().toUpperCase()

      // Check if room exists
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', cleanRoomCode)
        .single()

      if (roomError || !roomData) {
        console.error('Room lookup error:', roomError)
        setError(`Room not found. Make sure the code (${cleanRoomCode}) is correct.`)
        setJoining(false)
        return
      }

      // Check if room is expired
      if (new Date(roomData.expires_at) < new Date()) {
        setError('This Quidditch room has expired.')
        setJoining(false)
        return
      }

      // Check if user is already in the room
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', profile.id)
        .in('team_id', (
          await supabase.from('teams').select('id').eq('room_id', roomData.id)
        ).data?.map(t => t.id) || [])
        .maybeSingle()

      if (existingMember) {
        router.push(`/room/${roomCode}`)
        return
      }

      router.push(`/room/${roomCode}`)
    } catch {
      setError('A magical disturbance occurred. Please try again.')
      setJoining(false)
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
              Join Quidditch Room
            </h1>
            <p className="text-slate-400">Enter the room code to join a match</p>
          </div>

          <MagicalCard glow>
            <form onSubmit={handleJoinRoom} className="space-y-6">
              <MagicalInput
                type="text"
                placeholder="Room Code (e.g., QUID-AB12)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                required
              />

              {error && (
                <div className="bg-rose-600/20 border border-rose-500/50 rounded-lg p-3 text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <MagicalButton
                type="submit"
                disabled={joining}
                className="w-full"
              >
                {joining ? 'Joining...' : 'Join Room'}
              </MagicalButton>

              <button
                type="button"
                onClick={() => router.push('/play')}
                className="w-full py-3 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </form>
          </MagicalCard>

          <div className="mt-8">
            <button
              onClick={() => router.push('/play')}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold transition-all"
            >
              Back to Play
            </button>
          </div>
        </div>
      </div>
    </MagicalBackground>
  )
}
