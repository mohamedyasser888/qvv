'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MagicalBackground from '@/components/ui/MagicalBackground'
import MagicalCard from '@/components/ui/MagicalCard'
import MagicalNavbar from '@/components/ui/MagicalNavbar'
import AchievementCard from '@/components/ui/AchievementCard'
import LoadingMagic from '@/components/ui/LoadingMagic'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import { createClient } from '@/lib/supabase/client'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  requirement: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Profile {
  id: string
  magical_name: string
  house: 'gryffindor' | 'hufflepuff' | 'ravenclaw' | 'slytherin'
}

interface GameStats {
  mode: 'solo' | 'team'
  matches: number
  wins: number
  total_score: number
  total_saves: number
}

export default function AchievementsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [gameStats, setGameStats] = useState<GameStats[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- initial page load only

  const loadData = async () => {
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

      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('rarity')

      if (allAchievements) {
        setAchievements(allAchievements)
      }

      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id)

      if (userAchievements) {
        // @ts-ignore - Supabase types
        const ids = new Set<string>(userAchievements.map((ua: any) => ua.achievement_id))
        setUnlockedIds(ids)
      }

      const { data: statsData } = await supabase
        .from('player_game_stats')
        .select('mode, matches, wins, total_score, total_saves')
        .eq('user_id', user.id)

      if (statsData) setGameStats(statsData as unknown as GameStats[])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <MagicalBackground>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center animate-pulse">
            <div className="h-10 w-64 bg-gradient-to-r from-amber-500/20 to-amber-500/10 rounded mx-auto mb-2" />
            <div className="h-5 w-48 bg-slate-700/50 rounded mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-amber-200/20 bg-[#091321]/75 p-6 backdrop-blur-sm">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full mx-auto mb-4" />
                <div className="h-6 w-32 bg-slate-700/30 rounded mx-auto mb-2" />
                <div className="h-4 w-full bg-slate-700/20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </MagicalBackground>
    )
  }

  if (!profile) {
    return null
  }

  const unlockedCount = unlockedIds.size
  const totalCount = achievements.length
  const totals = gameStats.reduce(
    (result, stat) => ({
      matches: result.matches + stat.matches,
      wins: result.wins + stat.wins,
      score: result.score + stat.total_score,
      saves: result.saves + stat.total_saves,
      teamMatches: result.teamMatches + (stat.mode === 'team' ? stat.matches : 0),
    }),
    { matches: 0, wins: 0, score: 0, saves: 0, teamMatches: 0 }
  )
  const progressFor = (name: string) => {
    const progress = {
      'First Flight': [totals.matches, 1, 'match'],
      'First Victory': [totals.wins, 1, 'win'],
      "Keeper's Wall": [totals.saves, 10, 'saves'],
      "Chaser's Glory": [totals.score, 100, 'points'],
      'Team Player': [totals.teamMatches, 10, 'team matches'],
      'Quidditch Champion': [totals.wins, 10, 'wins'],
    } as const
    const item = progress[name as keyof typeof progress]
    return item ? `${Math.min(item[0], item[1])} / ${item[1]} ${item[2]}` : undefined
  }

  return (
    <MagicalBackground>
      <MagicalNavbar
        magicalName={profile.magical_name}
        house={profile.house}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-2">
            🏆 Achievements
          </h1>
          <p className="text-slate-400">
            {unlockedCount} of {totalCount} achievements unlocked
          </p>
        </div>

        {/* Progress Bar */}
        <MagicalCard className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold">Progress</span>
            <span className="text-amber-400 font-semibold">
              {Math.round((unlockedCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </MagicalCard>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              name={achievement.name}
              description={achievement.description}
              icon={achievement.icon}
              unlocked={unlockedIds.has(achievement.id)}
              rarity={achievement.rarity}
              progress={progressFor(achievement.name)}
            />
          ))}
        </div>
      </div>
    </MagicalBackground>
  )
}
