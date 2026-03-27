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
  const { currentChildProfile, lastMissionOutcome } = useGame()
  const routeState = location.state as CompletionState | null
  const [level, setLevel] = useState<GameLevel | null>(routeState?.level ?? null)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    if (level || !levelId) {
      return
    }

    void loadLevelDefinition(levelId, currentChildProfile?.age).then(setLevel).catch(() => undefined)
  }, [currentChildProfile?.age, level, levelId])

  const outcome = routeState?.outcome ?? lastMissionOutcome
  const summaryHints = level?.activities.flatMap((activity) => activity.hints.slice(0, 1)).slice(0, 5) ?? []

  if (!level || !outcome) {
    return (
      <ScreenLayout subtitle="אֵין כָּרֶגַע תּוֹצָאָה שְׁמוּרָה לְהַצָּגָה." title="אֵין נְתוּנֵי סִיּוּם" tone="sand">
        <Card className="mx-auto mt-12 max-w-2xl">
          <Button onClick={() => navigate('/worlds')}>חזרה למפה</Button>
        </Card>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout
      eyebrow="סִיּוּם מְשִׂימָה"
      subtitle="מָסַךְ סִיּוּם שֶׁמַּצִּיג פְּרָסִים, נְקֻדּוֹת, מַטְבְּעוֹת, כּוֹכָבִים וְהֶסְבֵּר מָלֵא."
      title={outcome.success ? 'הַמְּשִׂימָה הֻשְׁלְמָה בְּהַצְלָחָה!' : 'נְנַסֶּה שׁוּב יַחַד'}
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
            <p className="text-slate-600">{outcome.success ? 'עֲבוֹדָה מְצֻיֶּנֶת. אֶפְשָׁר לְהַמְשִׁיךְ לַמְּשִׂימָה הַבָּאָה.' : 'הֶסְבֵּר מָלֵא זָמִין בִּלְחִיצָה.'}</p>
            <div className="inline-flex items-center justify-center gap-3 rounded-full bg-[#fff4e8] px-5 py-3 text-2xl font-black text-[#d97706]">
              <span>⭐</span>
              <span>x{outcome.starsEarned}</span>
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
          <Button onClick={() => navigate('/worlds')}>
            חוזרים למפה
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button onClick={() => setShowExplanation(true)} variant="secondary">
            רואים הֶסְבֵּר מָלֵא
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

      <Modal onClose={() => setShowExplanation(false)} open={showExplanation} title="הֶסְבֵּר מָלֵא">
        <div className="space-y-4">
          <p className="rounded-[24px] bg-[#f8fafc] px-4 py-4 text-slate-700">{outcome.explanation}</p>
          <div className="space-y-3">
            {summaryHints.map((hint, index) => (
              <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm" key={`${hint.step}-${index + 1}`}>
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
