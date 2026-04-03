import { ShieldCheck, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useGame } from '@/hooks/useGame'
import type { ExperienceMode } from '@/types/models'

const hiddenPathPrefixes = ['/game/', '/mission-complete/']

export function ExperienceModeSwitcher() {
  const location = useLocation()
  const navigate = useNavigate()
  const { experienceMode, setExperienceMode } = useGame()

  if (hiddenPathPrefixes.some((prefix) => location.pathname.startsWith(prefix))) {
    return null
  }

  function switchMode(mode: ExperienceMode) {
    if (mode === experienceMode) {
      return
    }

    setExperienceMode(mode)

    if (mode === 'admin') {
      navigate('/worlds')
      return
    }

    navigate('/auth')
  }

  return (
    <div className="fixed right-4 top-4 z-[70] sm:right-6 sm:top-6">
      <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/88 px-2 py-2 shadow-[0_18px_40px_rgba(15,23,42,0.1)] backdrop-blur">
        <span className="px-2 text-[11px] font-bold tracking-[0.12em] text-slate-400">תצוגה</span>

        <button
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            experienceMode === 'admin'
              ? 'bg-[#f26a4b] text-white shadow-[0_12px_28px_rgba(242,106,75,0.24)]'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => switchMode('admin')}
          type="button"
        >
          <ShieldCheck className="h-4 w-4" />
          אדמין
        </button>

        <button
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            experienceMode === 'player'
              ? 'bg-[#2563eb] text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => switchMode('player')}
          type="button"
        >
          <UserRound className="h-4 w-4" />
          שחקן
        </button>
      </div>
    </div>
  )
}
