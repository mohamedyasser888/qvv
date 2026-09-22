'use client'

import { useCallback, useEffect, useState, memo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCachedLeaderboard } from '@/lib/queryCache'

type Mode = 'solo' | 'team'
type Metric = 'wins' | 'score' | 'saves'

interface ProfileRow {
  id: string
  magical_name: string
  house: string
}

interface StatsRow {
  user_id: string
  mode: Mode
  matches: number
  wins: number
  losses: number
  total_score: number
  total_saves: number
}

const houseColor: Record<string, string> = {
  gryffindor: 'from-red-500 to-amber-500',
  hufflepuff: 'from-amber-400 to-yellow-200',
  ravenclaw: 'from-blue-500 to-cyan-400',
  slytherin: 'from-emerald-500 to-green-300',
}

const houseAnimal: Record<string, string> = {
  gryffindor: '🦁',
  hufflepuff: '🦡',
  ravenclaw: '🦅',
  slytherin: '🐍',
}

function LeaderboardComponent() {
  const [supabase] = useState(() => createClient())
  const [mode, setMode] = useState<Mode>('solo')
  const [metric, setMetric] = useState<Metric>('wins')
  const [rows, setRows] = useState<(ProfileRow & Omit<StatsRow, 'user_id' | 'mode'>)[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [statsAvailable, setStatsAvailable] = useState(true)

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    const [{ data: profiles, error: profilesError }, { data: stats, error: statsError }] = await Promise.all([
      supabase.from('profiles').select('id, magical_name, house').order('magical_name'),
      supabase.from('player_game_stats').select('user_id, mode, matches, wins, losses, total_score, total_saves').eq('mode', mode),
    ])
    if (!profilesError) {
      const byUser = new Map((stats ?? []).map((item: StatsRow) => [item.user_id, item]))
      setRows((profiles ?? []).map((profile: ProfileRow) => {
        const stat = byUser.get(profile.id) as any
        return {
          ...profile,
          matches: stat?.matches ?? 0,
          wins: stat?.wins ?? 0,
          losses: stat?.losses ?? 0,
          total_score: stat?.total_score ?? 0,
          total_saves: stat?.total_saves ?? 0,
        }
      }))
      setUpdatedAt(new Date())
      setStatsAvailable(!statsError)
    } else {
      console.error('Unable to load leaderboard profiles:', profilesError)
    }
    setLoading(false)
    setRefreshing(false)
  }, [mode, supabase])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const channel = supabase
      .channel(`leaderboard:${mode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_game_stats' }, () => void load())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [load, mode, supabase])

  const sorted = [...rows].sort((a, b) => {
    const key = metric === 'score' ? 'total_score' : metric === 'saves' ? 'total_saves' : 'wins'
    return b[key] - a[key] || b.total_score - a.total_score || a.magical_name.localeCompare(b.magical_name)
  })
  const value = (row: typeof sorted[number]) => metric === 'score' ? row.total_score : metric === 'saves' ? row.total_saves : row.wins
  const label = metric === 'score' ? 'Points' : metric === 'saves' ? 'Saves' : 'Wins'

  return (
    <div className="relative min-h-[calc(100vh-15rem)] overflow-hidden rounded-[2rem] border border-amber-300/30 bg-slate-950/80 p-4 shadow-[0_0_90px_rgba(245,158,11,0.14)] backdrop-blur-xl sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(245,158,11,0.17),transparent_62%),radial-gradient(ellipse_45%_55%_at_100%_100%,rgba(126,34,206,0.2),transparent_68%)]" />
      <div className="relative mb-8 flex flex-col gap-5 border-b border-amber-300/15 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.32em] text-amber-300">THE WIZARDING LEAGUE</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">Hall of Fame</h2>
          <p className="mt-2 text-sm text-slate-300">Every registered witch and wizard · results update as matches finish</p>
        </div>
        <button onClick={() => void load(true)} disabled={refreshing} className="rounded-xl border border-amber-300/50 bg-gradient-to-r from-amber-500/20 to-yellow-400/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:scale-[1.02] hover:bg-amber-500/30 disabled:opacity-50">
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      <div className="relative mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <div className="flex flex-wrap gap-2">
        {(['solo', 'team'] as Mode[]).map(item => (
          <button key={item} onClick={() => setMode(item)} className={`rounded-lg px-4 py-2 text-sm font-black transition ${mode === item ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            {item === 'solo' ? '🧙 Solo' : '👥 Team'} Games
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-1.5">
        {(['wins', 'score', 'saves'] as Metric[]).map(item => (
          <button key={item} onClick={() => setMetric(item)} className={`rounded-lg px-4 py-2 text-sm font-black transition ${metric === item ? 'bg-purple-500 text-white shadow-[0_0_18px_rgba(168,85,247,0.45)]' : 'text-slate-300 hover:bg-white/10'}`}>
            {item === 'wins' ? '🏆 Wins' : item === 'score' ? '⚡ Score' : '🧤 Saves'}
          </button>
        ))}
      </div>
      </div>

      {!statsAvailable && <div className="relative mb-4 rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Stats are not connected yet, so all players are showing zero. Apply the leaderboard database migration, then press Refresh.</div>}

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50">
        <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_5rem] gap-2 bg-slate-900/95 px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 sm:grid-cols-[5rem_minmax(0,1fr)_6rem_6rem_6rem_6rem] sm:px-6">
          <span>Rank</span><span>Player</span><span className="text-right">{label}</span><span className="hidden text-right sm:block">Games</span><span className="hidden text-right sm:block">Score</span><span className="hidden text-right sm:block">Saves</span>
        </div>
        {loading ? <div className="p-10 text-center text-slate-400">Summoning standings…</div> : sorted.map((row, index) => (
          <div key={row.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_5rem] items-center gap-2 border-t border-white/5 px-3 py-4 transition hover:bg-amber-300/5 sm:grid-cols-[5rem_minmax(0,1fr)_6rem_6rem_6rem_6rem] sm:px-6">
            <span className={`text-lg font-black ${index < 3 ? 'text-amber-300' : 'text-slate-500'}`}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
            <div className="flex min-w-0 items-center gap-3"><span title={`${row.house} crest`} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 bg-gradient-to-br text-xl shadow-lg ${houseColor[row.house] ?? 'from-slate-500 to-slate-700'}`}>{houseAnimal[row.house] ?? '✨'}</span><div className="min-w-0"><div className="truncate font-bold text-white">{row.magical_name}</div><div className="text-xs capitalize text-slate-500">{row.matches} matches · {row.wins}W / {row.losses}L</div></div></div>
            <span className="text-right font-black text-amber-300">{value(row)}</span><span className="hidden text-right font-bold text-white sm:block">{row.matches}</span><span className="hidden text-right font-bold text-white sm:block">{row.total_score}</span><span className="hidden text-right font-bold text-white sm:block">{row.total_saves}</span>
          </div>
        ))}
      </div>
      <p className="relative mt-4 text-right text-xs text-slate-500">{updatedAt ? `Last synchronized ${updatedAt.toLocaleTimeString()}` : 'Waiting for data'}</p>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
const Leaderboard = memo(LeaderboardComponent)
export default Leaderboard


