import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { ArrowLeft, House, Lightbulb, Pause, Settings } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import type { GameLevel } from '@/game/engine/level-schema'
import { MiniGameHost } from '@/game/runtime/MiniGameHost'
import type { GameCompletion } from '@/game/runtime/renderer-types'
import { useGame } from '@/hooks/useGame'
import { loadLevelDefinition } from '@/services/levelService'

type LoadState = 'loading' | 'ready' | 'error'
type SuccessCelebration = {
  id: number
  stars: number
  title: string
  subtitle: string
}

const successCelebrationDurationMs = 1150

export function GameScreen() {
  const { levelId } = useParams()

  if (!levelId) {
    return (
      <ScreenLayout subtitle="לֹא הִתְקַבֵּל מַזְהֵה שָׁלָב מֵהַמַּעֲרֶכֶת." title="שָׁלָב חָסֵר" tone="sand">
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
  const { completeMission, currentChildProfile, startMission } = useGame()
  const [level, setLevel] = useState<GameLevel | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mistakeMessage, setMistakeMessage] = useState<string | null>(null)
  const [mistakeCount, setMistakeCount] = useState(0)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [currentActivityMistakes, setCurrentActivityMistakes] = useState(0)
  const [activityScores, setActivityScores] = useState<number[]>([])
  const [earnedStars, setEarnedStars] = useState(0)
  const [hintIndex, setHintIndex] = useState(0)
  const [isHintOpen, setIsHintOpen] = useState(false)
  const [isPauseOpen, setIsPauseOpen] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [successCelebration, setSuccessCelebration] = useState<SuccessCelebration | null>(null)
  const successTimerRef = useRef<number | null>(null)

  const startMissionEffect = useEffectEvent((nextLevelId: string) => {
    startMission(nextLevelId)
  })

  function clearSuccessTimer() {
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
  }

  useEffect(() => () => clearSuccessTimer(), [])

  useEffect(() => {
    startMissionEffect(levelId)
    clearSuccessTimer()

    let isCancelled = false

    void loadLevelDefinition(levelId, currentChildProfile?.age)
      .then((nextLevel) => {
        if (isCancelled) {
          return
        }

        setLevel(nextLevel)
        setCurrentActivityIndex(0)
        setCurrentActivityMistakes(0)
        setActivityScores([])
        setEarnedStars(0)
        setHintIndex(0)
        setMistakeCount(0)
        setMistakeMessage(null)
        setIsCompleted(false)
        setSuccessCelebration(null)
        setLoadState('ready')
      })
      .catch((error) => {
        if (isCancelled) {
          return
        }

        setLoadState('error')
        setErrorMessage(error instanceof Error ? error.message : 'לֹא נִתַּן הָיָה לִטְעוֹן אֶת הַשָּׁלָב')
      })

    return () => {
      isCancelled = true
    }
  }, [currentChildProfile?.age, levelId])

  function handleMistake(message: string) {
    setMistakeMessage(message)
    setMistakeCount((current) => current + 1)
    setCurrentActivityMistakes((current) => current + 1)
  }

  function handleSuccess(completion: GameCompletion) {
    if (!level || isCompleted || successCelebration) {
      return
    }

    const resolvedActivityCount = Math.max(1, level.activities.length)
    const resolvedStarsPerQuestion = level.rewards.starsPerQuestion ?? 0
    const currentScore = Math.max(40, completion.score - currentActivityMistakes * 12)
    const nextScores = [...activityScores, currentScore]
    const nextEarnedStars = earnedStars + resolvedStarsPerQuestion
    const isFinalActivity = currentActivityIndex >= resolvedActivityCount - 1
    const nextQuestionNumber = currentActivityIndex + 2

    setEarnedStars(nextEarnedStars)
    setMistakeMessage(null)
    setSuccessCelebration({
      id: Date.now(),
      stars: resolvedStarsPerQuestion,
      title: `קִבַּלְתְּ ${resolvedStarsPerQuestion} כּוֹכָבִים!`,
      subtitle: isFinalActivity
        ? 'כָּל הַכָּבוֹד! הַשָּׁלָב הוּשְׁלַם בְּהַצְלָחָה.'
        : `כָּל הַכָּבוֹד! מַמְשִׁיכִים לַשְּׁאֵלָה ${nextQuestionNumber} מִתּוֹךְ ${resolvedActivityCount}.`,
    })

    clearSuccessTimer()
    successTimerRef.current = window.setTimeout(() => {
      setSuccessCelebration(null)

      if (!isFinalActivity) {
        setActivityScores(nextScores)
        setCurrentActivityIndex((current) => current + 1)
        setCurrentActivityMistakes(0)
        setHintIndex(0)
        return
      }

      setIsCompleted(true)

      const averageScore = Math.round(nextScores.reduce((total, value) => total + value, 0) / nextScores.length)
      const outcome = completeMission({
        levelId: level.id,
        worldId: level.worldId,
        subject: level.subject,
        score: averageScore,
        xpEarned: level.rewards.xp,
        coinsEarned: level.rewards.coins,
        starsEarned: nextEarnedStars,
        explanation: `${completion.explanation} הושלמו ${resolvedActivityCount} שאלות בשלב.`,
      })

      navigate(`/mission-complete/${level.id}`, {
        state: {
          level,
          outcome,
        },
      })
    }, successCelebrationDurationMs)
  }

  if (loadState === 'loading') {
    return (
      <ScreenLayout subtitle="טוֹעֵן קוֹבֶץ שָׁלָב, בּוֹדֵק אוֹתוֹ וּמֵכִין אֶת הַמִּשְׂחָק..." title="טוֹעֵן מְשִׂימָה" tone="sky">
        <Card className="mx-auto mt-12 max-w-2xl space-y-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-[#0ea5e9] border-t-transparent pulse-soft" />
          <p className="text-slate-600">השלב נטען עכשיו מתוך קובץ JSON.</p>
        </Card>
      </ScreenLayout>
    )
  }

  if (loadState === 'error' || !level) {
    return (
      <ScreenLayout subtitle="בְּדֹק אֶת קוֹבֶץ ה־JSON אוֹ חֲזֹר לְמַפַּת הַהַרְפַּתְקָה." title="שְׁגִיאָה בַּשָּׁלָב" tone="sand">
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

  const currentActivity = level.activities[Math.min(currentActivityIndex, level.activities.length - 1)]
  const currentHint = currentActivity.hints[Math.min(hintIndex, currentActivity.hints.length - 1)]

  return (
    <ScreenLayout
      contentClassName="flex min-h-0 flex-col"
      actions={
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/worlds')} size="md" variant="secondary">
            <ArrowLeft className="h-5 w-5" />
            חֲזָרָה לַמַּפָּה
          </Button>
          <Button
            className="shadow-[0_18px_42px_rgba(242,106,75,0.34)]"
            onClick={() => navigate('/home')}
            size="md"
            variant="primary"
          >
            <House className="h-5 w-5" />
            עוֹלַם הַגּוּרִים
          </Button>
          <Button onClick={() => setIsHintOpen(true)} size="md" variant="secondary">
            <Lightbulb className="h-5 w-5" />
            רֶמֶז
          </Button>
          <Button onClick={() => setIsPauseOpen(true)} size="md" variant="secondary">
            <Pause className="h-5 w-5" />
            הַפְסָקָה
          </Button>
          <Button onClick={() => navigate('/settings')} size="md" variant="secondary">
            <Settings className="h-5 w-5" />
            הַגְדָּרוֹת
          </Button>
        </div>
      }
      eyebrow="מָסַךְ מִשְׂחָק"
      subtitle={level.instructions}
      title={level.title}
      tone="sunrise"
    >
      <div className="relative flex min-h-0 flex-1 flex-col gap-4">
        {successCelebration && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6">
            <div className="success-celebration-card w-full max-w-xl rounded-[34px] border border-white/90 bg-white/92 px-8 py-8 text-center shadow-[0_28px_60px_rgba(15,23,42,0.14)] backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 text-5xl">
                {Array.from({ length: Math.max(1, successCelebration.stars) }, (_, index) => (
                  <span
                    className="success-celebration-star"
                    key={`${successCelebration.id}-${index + 1}`}
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <p className="mt-5 text-3xl font-black text-[#d97706]">{successCelebration.title}</p>
              <p className="mt-3 text-xl font-bold text-slate-900">הַצְלָחָה!</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">{successCelebration.subtitle}</p>
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-6xl space-y-4 xl:min-h-0">
          <Card className="grid gap-3 p-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-sm font-semibold text-slate-500">התקדמות בשלב</p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {currentActivityIndex + 1}/{level.activities.length}
              </p>
            </div>
            <div className="rounded-[24px] bg-[#fff7ed] px-4 py-3 text-center shadow-sm">
              <p className="text-sm font-semibold text-slate-500">כוכבים בשלב הזה</p>
              <p className="mt-1 text-2xl font-black text-[#d97706]">{earnedStars}</p>
            </div>
            <div className="rounded-[24px] bg-[#eefaf6] px-4 py-3 text-center shadow-sm">
              <p className="text-sm font-semibold text-slate-500">טעויות בשאלה הנוכחית</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{currentActivityMistakes}</p>
            </div>
          </Card>

          {mistakeMessage && (
            <Card className="border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="font-semibold">{mistakeMessage}</p>
              <p className="mt-2 text-sm">
                טעויות כרגע: {mistakeCount} / {level.completionRules.maxMistakes}
              </p>
            </Card>
          )}

          <MiniGameHost
            activity={currentActivity}
            disabled={isCompleted || Boolean(successCelebration)}
            key={currentActivity.id}
            onMistake={handleMistake}
            onSuccess={handleSuccess}
          />
        </div>
      </div>

      <Modal onClose={() => setIsHintOpen(false)} open={isHintOpen} title="מַעֲרֶכֶת רְמָזִים">
        <div className="space-y-4">
          <div className="rounded-[24px] bg-[#fff7ed] px-4 py-4">
            <p className="text-sm font-semibold tracking-[0.2em] text-slate-500">רמז {currentHint.step}</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{currentHint.title}</h3>
            <p className="mt-2 text-slate-600">{currentHint.body}</p>
          </div>
          <div className="flex gap-3">
            <Button
              disabled={hintIndex >= currentActivity.hints.length - 1}
              onClick={() => setHintIndex((current) => Math.min(current + 1, currentActivity.hints.length - 1))}
            >
              רמז הבא
            </Button>
            <Button onClick={() => setIsHintOpen(false)} variant="secondary">
              חזרה למשחק
            </Button>
          </div>
        </div>
      </Modal>

      <Modal onClose={() => setIsPauseOpen(false)} open={isPauseOpen} title="הַמִּשְׂחָק בַּהַפְסָקָה">
        <div className="space-y-4">
          <p className="text-slate-600">אפשר לחזור מיד למשחק או לצאת למפת ההרפתקה בלי לאבד את המבנה.</p>
          <div className="flex gap-3">
            <Button onClick={() => setIsPauseOpen(false)}>המשך משחק</Button>
            <Button onClick={() => navigate('/worlds')} variant="secondary">
              יציאה למפה
            </Button>
          </div>
        </div>
      </Modal>
    </ScreenLayout>
  )
}
