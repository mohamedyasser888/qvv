'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import MagicalBackground from '@/components/ui/MagicalBackground'
import MagicalCard from '@/components/ui/MagicalCard'
import MagicalNavbar from '@/components/ui/MagicalNavbar'
import HouseBadge from '@/components/ui/HouseBadge'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import LoadingMagic from '@/components/ui/LoadingMagic'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import { createClient } from '@/lib/supabase/client'

// Lazy load Leaderboard component (only when needed)
const Leaderboard = dynamic(() => import('@/components/Leaderboard'), {
  loading: () => <LoadingSkeleton variant="list" />,
  ssr: false, // Client-side only
})

interface Profile {
  id: string
  magical_name: string
  house: 'gryffindor' | 'hufflepuff' | 'ravenclaw' | 'slytherin'
  avatar: string | null
  created_at: string
}

interface UserAchievement {
  achievement_id: string
  achievements: {
    name: string
    icon: string
    rarity: string
  }
}

export default function HomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard'>('home')

  const supabase = createClient()

  async function loadProfile() {
    try {
      // The middleware already validates protected routes. getSession reads the
      // local session instead of making another auth request after login.
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      
      if (!user) {
        router.push('/login')
        return
      }

      const magicalName = user.user_metadata.magical_name
      const house = user.user_metadata.house
      if (
        typeof magicalName === 'string' &&
        (house === 'gryffindor' || house === 'hufflepuff' || house === 'ravenclaw' || house === 'slytherin')
      ) {
        // Render the Academy immediately from the signed-in user's session;
        // the database data below refreshes quietly in the background.
        setProfile({
          id: user.id,
          magical_name: magicalName,
          house,
          avatar: null,
          created_at: user.created_at,
        })
        setLoading(false)
      }

      const [{ data: profileData }, { data: achievementData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_achievements')
          .select('achievement_id, achievements(name, icon, rarity)')
          .eq('user_id', user.id),
      ])

      if (profileData) {
        setProfile(profileData)
      }

      if (achievementData) {
        setAchievements(achievementData as unknown as UserAchievement[])
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <MagicalBackground>
        <LoadingSkeleton variant="profile" />
      </MagicalBackground>
    )
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

      <div className={`${activeTab === 'leaderboard' ? 'max-w-[96rem]' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {/* Welcome Section */}
        <div className={`mb-8 rounded-3xl border border-amber-200/20 bg-[#091321]/75 px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm ${activeTab === 'leaderboard' ? 'sm:px-10' : ''}`}>
          <p className="mb-2 text-xs font-black tracking-[0.32em] text-[#d3a625]">HOGWARTS QUIDDITCH CLUB</p>
          <h1 className="text-4xl font-black bg-gradient-to-r from-amber-100 via-[#d3a625] to-amber-100 bg-clip-text text-transparent mb-2">
            Welcome, {profile.magical_name}!
          </h1>
          <p className="text-slate-300">Your place in the Quidditch Academy awaits.</p>
        </div>

        <div className="mb-8 flex w-fit rounded-xl border border-white/10 bg-slate-900/70 p-1">
          <button onClick={() => setActiveTab('home')} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${activeTab === 'home' ? 'bg-[#740001] text-white shadow-[0_0_16px_rgba(116,0,1,0.55)]' : 'text-slate-400 hover:text-white'}`}>Academy</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${activeTab === 'leaderboard' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>🏆 Leaderboard</button>
        </div>

        {activeTab === 'leaderboard' ? <Leaderboard /> : <>
        {/* Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MagicalCard glow>
            <div className="flex items-center gap-4 mb-4">
              <PlayerAvatar
                magicalName={profile.magical_name}
                house={profile.house}
                size="lg"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">House</span>
                <HouseBadge house={profile.house} showName />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member Since</span>
                <span className="text-white">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </MagicalCard>

          <MagicalCard glow>
            <h2 className="text-xl font-bold text-amber-400 mb-4">🏆 Achievements</h2>
            <div className="text-4xl font-bold text-white mb-2">{achievements.length}</div>
            <p className="text-slate-400">Unlocked</p>
            <button
              onClick={() => router.push('/achievements')}
              className="mt-4 text-amber-400 hover:text-amber-300 font-semibold"
            >
              View All →
            </button>
          </MagicalCard>

          <MagicalCard glow>
            <h2 className="text-xl font-bold text-amber-400 mb-4">⚡ Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/play')}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl font-semibold transition-all"
              >
                Play Quidditch
              </button>
              <button
                onClick={() => router.push('/achievements')}
                className="w-full py-3 bg-gradient-to-r from-[#0e4a86] to-[#1a472a] hover:from-[#1462ab] hover:to-[#236038] text-white rounded-xl font-semibold transition-all"
              >
                View Achievements
              </button>
            </div>
          </MagicalCard>
        </div>

        {/* Recent Achievements Preview */}
        {achievements.length > 0 && (
          <MagicalCard>
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Recent Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.slice(0, 4).map((ua, index) => (
                <div key={index} className="text-center p-4 bg-slate-800/50 rounded-xl">
                  <div className="text-3xl mb-2">{ua.achievements.icon}</div>
                  <div className="text-white text-sm font-semibold">
                    {ua.achievements.name}
                  </div>
                  <div className="text-xs text-slate-400 capitalize">
                    {ua.achievements.rarity}
                  </div>
                </div>
              ))}
            </div>
          </MagicalCard>
        )}
        </>}
      </div>
    </MagicalBackground>
  )
}
