import { useEffect, useState } from 'react'
import { ArrowLeft, Home, PartyPopper, RotateCcw, Sparkles } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import type { GameLevel } from '@/game/engine/level-schema'
import { useGame } from '@/hooks/useGame'
import { loadLevelDefinition } from '@/services/levelService'
import type { MissionOutcome } from '@/types/models'

interface CompletionState {
  level: GameLevel
  outcome: MissionOutcome
}

export function MissionCompleteScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { levelId } = useParams()
  const { lastMissionOutcome } = useGame()
  const routeState = location.state as CompletionState | null
  const [level, setLevel] = useState<GameLevel | null>(routeState?.level ?? null)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    if (level || !levelId) {
      return
    }

    void loadLevelDefinition(levelId).then(setLevel).catch(() => undefined)
  }, [level, levelId])

  const outcome = routeState?.outcome ?? lastMissionOutcome

  if (!level || !outcome) {
    return (
      <ScreenLayout subtitle="אין כרגע תוצאה שמורה להצגה." title="אין נתוני סיום" tone="sand">
        <Card className="mx-auto mt-12 max-w-2xl">
          <Button onClick={() => navigate('/worlds')}>חזרה למפה</Button>
        </Card>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout
      eyebrow="סיום משימה"
      subtitle="מסך סיום שמציג פרסים, נקודות, מטבעות, כוכבים והסבר מלא."
      title={outcome.success ? 'המשימה הושלמה בהצלחה!' : 'ננסה שוב יחד'}
      tone="mint"
    >
      <div className="mx-auto grid max-w-4xl gap-6">
        <Card className="relative overflow-hidden bg-[#fffdf7] text-center">
          <div className="sparkle-soft absolute left-8 top-8 text-5xl">✨</div>
          <div className="sparkle-soft absolute bottom-8 right-8 text-5xl">🌟</div>
          <div className="space-y-4 py-6">
            <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#fff4e8] text-[#f59e0b]">
              <PartyPopper className="h-10 w-10" />
            </div>
            <h2 className="font-display text-4xl text-slate-900">{level.title}</h2>
            <p className="text-slate-600">{outcome.success ? 'עבודה מצוינת. אפשר להמשיך למשימה הבאה.' : 'הסבר מלא זמין בלחיצה.'}</p>
            <div className="text-3xl">
              {Array.from({ length: outcome.starsEarned }, (_, index) =>
                index < outcome.starsEarned ? '⭐' : '☆',
              ).join(' ')}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="text-center">
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">נקודות</p>
            <p className="mt-3 font-display text-4xl text-slate-900">+{outcome.xpEarned}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">מטבעות</p>
            <p className="mt-3 font-display text-4xl text-slate-900">+{outcome.coinsEarned}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">ציון</p>
            <p className="mt-3 font-display text-4xl text-slate-900">{outcome.score}%</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">כוכבים</p>
            <p className="mt-3 inline-flex items-center gap-2 font-display text-4xl text-slate-900">
              <Sparkles className="h-8 w-8 text-[#f59e0b]" />
              +{outcome.starsEarned}
            </p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate(`/worlds/${level.worldId}/missions`)}>
            ממשיכים למשימות
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button onClick={() => setShowExplanation(true)} variant="secondary">
            רואים הסבר מלא
          </Button>
          <Button onClick={() => navigate(`/game/${level.id}`)} variant="secondary">
            <RotateCcw className="h-5 w-5" />
            משחקים שוב
          </Button>
          <Button onClick={() => navigate('/home')} variant="secondary">
            <Home className="h-5 w-5" />
            חוזרים לבית
          </Button>
        </div>
      </div>

      <Modal onClose={() => setShowExplanation(false)} open={showExplanation} title="הסבר מלא">
        <div className="space-y-4">
          <p className="rounded-[24px] bg-[#f8fafc] px-4 py-4 text-slate-700">{outcome.explanation}</p>
          <div className="space-y-3">
            {level.hints.map((hint) => (
              <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm" key={hint.step}>
                <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">שלב {hint.step}</p>
                <p className="mt-2 font-bold text-slate-900">{hint.title}</p>
                <p className="mt-1 text-sm text-slate-600">{hint.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </ScreenLayout>
  )
}
