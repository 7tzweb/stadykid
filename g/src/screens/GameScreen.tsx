import { useEffect, useEffectEvent, useState } from 'react'
import { Lightbulb, Pause, Settings, Heart } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { PhaserStageCanvas } from '@/components/game/PhaserStageCanvas'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { GameLevel } from '@/game/engine/level-schema'
import { MiniGameHost } from '@/game/runtime/MiniGameHost'
import type { GameCompletion } from '@/game/runtime/renderer-types'
import { useGame } from '@/hooks/useGame'
import { loadLevelDefinition } from '@/services/levelService'

type LoadState = 'loading' | 'ready' | 'error'

export function GameScreen() {
  const { levelId } = useParams()

  if (!levelId) {
    return (
      <ScreenLayout subtitle="לא התקבל מזהה שלב מהמערכת." title="שלב חסר" tone="sand">
        <Card className="mx-auto mt-12 max-w-2xl">
          <Button onClick={() => window.history.back()}>חזרה</Button>
        </Card>
      </ScreenLayout>
    )
  }

  return <GameScreenSession key={levelId} levelId={levelId} />
}

function GameScreenSession({ levelId }: { levelId: string }) {
  const navigate = useNavigate()
  const { completeMission, startMission, xp } = useGame()
  const [level, setLevel] = useState<GameLevel | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mistakeMessage, setMistakeMessage] = useState<string | null>(null)
  const [mistakeCount, setMistakeCount] = useState(0)
  const [hintIndex, setHintIndex] = useState(0)
  const [isHintOpen, setIsHintOpen] = useState(false)
  const [isPauseOpen, setIsPauseOpen] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const startMissionEffect = useEffectEvent((nextLevelId: string) => {
    startMission(nextLevelId)
  })

  useEffect(() => {
    startMissionEffect(levelId)

    let isCancelled = false

    void loadLevelDefinition(levelId)
      .then((nextLevel) => {
        if (isCancelled) {
          return
        }

        setLevel(nextLevel)
        setLoadState('ready')
      })
      .catch((error) => {
        if (isCancelled) {
          return
        }

        setLoadState('error')
        setErrorMessage(error instanceof Error ? error.message : 'לא ניתן היה לטעון את השלב')
      })

    return () => {
      isCancelled = true
    }
  }, [levelId])

  function handleMistake(message: string) {
    setMistakeMessage(message)
    setMistakeCount((current) => current + 1)
  }

  function handleSuccess(completion: GameCompletion) {
    if (!level || isCompleted) {
      return
    }

    setIsCompleted(true)

    const outcome = completeMission({
      levelId: level.id,
      worldId: level.worldId,
      subject: level.subject,
      score: completion.score,
      xpEarned: level.rewards.xp,
      coinsEarned: level.rewards.coins,
      explanation: completion.explanation,
    })

    navigate(`/mission-complete/${level.id}`, {
      state: {
        level,
        outcome,
      },
    })
  }

  if (loadState === 'loading') {
    return (
      <ScreenLayout subtitle="טוען קובץ שלב, בודק אותו ומכין את המשחק..." title="טוען משימה" tone="sky">
        <Card className="mx-auto mt-12 max-w-2xl space-y-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-[#0ea5e9] border-t-transparent pulse-soft" />
          <p className="text-slate-600">השלב נטען עכשיו מתוך קובץ JSON.</p>
        </Card>
      </ScreenLayout>
    )
  }

  if (loadState === 'error' || !level) {
    return (
      <ScreenLayout subtitle="בדוק את קובץ ה-JSON או חזור למסך המשימות." title="שגיאה בשלב" tone="sand">
        <Card className="mx-auto mt-12 max-w-2xl space-y-4">
          <p className="rounded-[24px] bg-rose-50 px-4 py-4 text-rose-700">{errorMessage}</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/worlds')}>חזרה למפה</Button>
            <Button onClick={() => window.location.reload()} variant="secondary">
              טעינה מחדש
            </Button>
          </div>
        </Card>
      </ScreenLayout>
    )
  }

  const currentHint = level.hints[Math.min(hintIndex, level.hints.length - 1)]
  const remainingHearts = Math.max(0, 3 - mistakeCount)

  return (
    <ScreenLayout
      contentClassName="flex min-h-0 flex-col"
      actions={
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setIsHintOpen(true)} size="md" variant="secondary">
            <Lightbulb className="h-5 w-5" />
            רמז
          </Button>
          <Button onClick={() => setIsPauseOpen(true)} size="md" variant="secondary">
            <Pause className="h-5 w-5" />
            הפסקה
          </Button>
          <Button onClick={() => navigate('/settings')} size="md" variant="secondary">
            <Settings className="h-5 w-5" />
            הגדרות
          </Button>
        </div>
      }
      eyebrow="מסך משחק"
      subtitle={level.instructions}
      title={level.title}
      tone="sunrise"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <Card className="grid gap-3 p-4 md:grid-cols-3">
          {[
            {
              title: '1. קוראים',
              description: 'מבינים מה צריך לעשות בשלב הזה.',
            },
            {
              title: '2. פותרים',
              description: 'לוחצים או גוררים לפי סוג המשחק.',
            },
            {
              title: '3. מנצחים',
              description: 'מסיימים ומקבלים נקודות ופרסים.',
            },
          ].map((item) => (
            <div className="rounded-[24px] bg-[#fff8f2] px-4 py-3" key={item.title}>
              <p className="text-base font-bold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </Card>

        <div className="grid flex-1 gap-4 xl:min-h-0 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-start">
          <Card className="space-y-4 p-4 xl:h-full">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="rounded-full bg-[#fff7ed] px-4 py-3">
                <div className="flex items-center gap-2">
                  {Array.from({ length: 3 }, (_, index) => (
                    <Heart
                      className={`h-6 w-6 ${index < remainingHearts ? 'fill-[#ef4444] text-[#ef4444]' : 'text-slate-300'}`}
                      key={index}
                    />
                  ))}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <ProgressBar
                  accent="#f26a4b"
                  label="נקודות ניסיון"
                  value={(xp % 500) / 5}
                  valueLabel={`${xp} נקודות`}
                />
              </div>
            </div>

            <PhaserStageCanvas level={level} />
          </Card>

          <div className="space-y-4 xl:min-h-0">
            {mistakeMessage && (
              <Card className="border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="font-semibold">{mistakeMessage}</p>
                <p className="mt-2 text-sm">
                  טעויות כרגע: {mistakeCount} / {level.completionRules.maxMistakes}
                </p>
              </Card>
            )}

            <MiniGameHost disabled={isCompleted} level={level} onMistake={handleMistake} onSuccess={handleSuccess} />
          </div>
        </div>
      </div>

      <Modal onClose={() => setIsHintOpen(false)} open={isHintOpen} title="מערכת רמזים">
        <div className="space-y-4">
          <div className="rounded-[24px] bg-[#fff7ed] px-4 py-4">
            <p className="text-sm font-semibold tracking-[0.2em] text-slate-500">רמז {currentHint.step}</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{currentHint.title}</h3>
            <p className="mt-2 text-slate-600">{currentHint.body}</p>
          </div>
          <div className="flex gap-3">
            <Button
              disabled={hintIndex >= level.hints.length - 1}
              onClick={() => setHintIndex((current) => Math.min(current + 1, level.hints.length - 1))}
            >
              רמז הבא
            </Button>
            <Button onClick={() => setIsHintOpen(false)} variant="secondary">
              חזרה למשחק
            </Button>
          </div>
        </div>
      </Modal>

      <Modal onClose={() => setIsPauseOpen(false)} open={isPauseOpen} title="המשחק בהפסקה">
        <div className="space-y-4">
          <p className="text-slate-600">אפשר לחזור מיד למשחק או לצאת למסך המשימות בלי לאבד את המבנה.</p>
          <div className="flex gap-3">
            <Button onClick={() => setIsPauseOpen(false)}>המשך משחק</Button>
            <Button onClick={() => navigate(`/worlds/${level.worldId}/missions`)} variant="secondary">
              יציאה למסך המשימות
            </Button>
          </div>
        </div>
      </Modal>
    </ScreenLayout>
  )
}
