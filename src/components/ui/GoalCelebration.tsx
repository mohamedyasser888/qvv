'use client'

import { useEffect, useState, memo } from 'react'

interface GoalCelebrationProps {
  team: 1 | 2
  points: number
  isStreakBonus?: boolean
  onComplete?: () => void
}

function GoalCelebrationComponent({ team, points, isStreakBonus, onComplete }: GoalCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([])
  
  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50, // -50 to 50
      y: Math.random() * 100 - 50,
      delay: Math.random() * 0.3,
      duration: 1 + Math.random() * 0.5,
    }))
    setParticles(newParticles)

    // Auto-complete after animation
    const timer = setTimeout(() => {
      onComplete?.()
    }, 2500)

    return () => clearTimeout(timer)
  }, [onComplete])

  const teamColor = team === 1 ? 'purple' : 'amber'
  const teamName = team === 1 ? 'PURPLE' : 'YELLOW'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-3 h-3 rounded-full bg-${teamColor}-400 opacity-0 animate-[particle_${particle.duration}s_ease-out_${particle.delay}s_forwards]`}
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            animation: `particle ${particle.duration}s ease-out ${particle.delay}s forwards`,
            '--particle-x': `${particle.x}vw`,
            '--particle-y': `${particle.y}vh`,
          } as React.CSSProperties}
        />
      ))}

      {/* Main celebration text */}
      <div className="flex flex-col items-center gap-4 animate-[celebrationBounce_0.6s_ease-out]">
        {/* Goal announcement */}
        <div className={`text-8xl font-black tracking-wider ${team === 1 ? 'text-purple-400' : 'text-amber-400'} drop-shadow-[0_0_30px_currentColor] animate-pulse`}>
          ⚽ GOAL!
        </div>

        {/* Team name */}
        <div className={`text-4xl font-black ${team === 1 ? 'text-purple-300' : 'text-amber-300'} drop-shadow-[0_0_20px_currentColor]`}>
          {teamName} SCORES
        </div>

        {/* Points */}
        <div className="flex items-center gap-3">
          <div className={`text-6xl font-black ${team === 1 ? 'text-purple-400' : 'text-amber-400'} drop-shadow-[0_0_25px_currentColor] animate-[scaleUp_0.4s_ease-out]`}>
            +{points}
          </div>
          {isStreakBonus && (
            <div className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-[slideInRight_0.5s_ease-out_0.3s_both]">
              🔥 STREAK!
            </div>
          )}
        </div>
      </div>

      {/* Fireworks effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${team === 1 ? 'bg-purple-400' : 'bg-amber-400'}`}
            style={{
              left: `${20 + i * 10}%`,
              top: '20%',
              animation: `firework 1.5s ease-out ${i * 0.1}s forwards`,
            }}
          />
        ))}
      </div>

      {/* Add keyframes */}
      <style jsx>{`
        @keyframes particle {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--particle-x)), calc(-50% + var(--particle-y))) scale(0);
            opacity: 0;
          }
        }

        @keyframes celebrationBounce {
          0%, 100% {
            transform: scale(0.8) translateY(20px);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) translateY(-10px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleUp {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          0% {
            transform: translateX(100px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes firework {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Memoize to avoid re-rendering on parent updates
const GoalCelebration = memo(GoalCelebrationComponent)
export default GoalCelebration

