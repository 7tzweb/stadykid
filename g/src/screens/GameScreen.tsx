import clsx from 'clsx'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, Circle, Coins, Flag, House, Lightbulb, Pause, Settings, ShoppingBag, Sparkles } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import type { GameActivity, GameLevel } from '@/game/engine/level-schema'
import { MiniGameHost } from '@/game/runtime/MiniGameHost'
import type { GameCompletion } from '@/game/runtime/renderer-types'
import { useGame } from '@/hooks/useGame'
import { loadLevelDefinition } from '@/services/levelService'
import {
  getCompletedLevelIdsForTrack,
  getLevelTrackLabel,
  getResolvedActiveLevelTrack,
} from '@/services/levelTrackService'
import {
  buildLevelProgressStorageKey,
  clearStoredLevelProgress,
  loadStoredLevelProgress,
  persistStoredLevelProgress,
} from '@/services/levelProgressService'

type LoadState = 'loading' | 'ready' | 'error'
type SuccessCelebration = {
  id: number
  stars: number
  title: string
  subtitle: string
}

const successCelebrationDurationMs = 1150

function getActivityTypeLabel(activityType: GameActivity['type']) {
  switch (activityType) {
    case 'multiple_choice':
      return 'בחירה'
    case 'drag_and_drop':
      return 'גרירה'
    case 'match_pairs':
      return 'זוגות'
    case 'memory_cards':
      return 'זיכרון'
    default:
      return 'משחק'
  }
}

function getActivityTypePalette(activityType: GameActivity['type']) {
  switch (activityType) {
    case 'multiple_choice':
      return {
        badge: 'border-[#ffd8c2] bg-[#fff5ee] text-[#ea580c]',
        iconWrap: 'bg-[#fff1eb] text-[#ea580c]',
      }
    case 'drag_and_drop':
      return {
        badge: 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]',
        iconWrap: 'bg-[#e0f2fe] text-[#0369a1]',
      }
    case 'match_pairs':
      return {
        badge: 'border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]',
        iconWrap: 'bg-[#ede9fe] text-[#6d28d9]',
      }
    case 'memory_cards':
      return {
        badge: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
        iconWrap: 'bg-[#dcfce7] text-[#166534]',
      }
    default:
      return {
        badge: 'border-slate-200 bg-slate-50 text-slate-700',
        iconWrap: 'bg-slate-100 text-slate-700',
      }
  }
}

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
  const { addStars, coins, completeMission, currentChildProfile, experienceMode, startMission, stars, xp } = useGame()
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
  const activeLevelTrack = getResolvedActiveLevelTrack(currentChildProfile)
  const completedLevelIdsForTrack = getCompletedLevelIdsForTrack(currentChildProfile, activeLevelTrack)
  const isCurrentLevelAlreadyCompleted = completedLevelIdsForTrack.includes(levelId)
  const levelProgressStorageKey = buildLevelProgressStorageKey(
    experienceMode,
    currentChildProfile?.id,
    levelId,
    activeLevelTrack,
  )

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

    void loadLevelDefinition(levelId, currentChildProfile?.age, activeLevelTrack)
      .then((nextLevel) => {
        if (isCancelled) {
          return
        }

        const storedProgress = loadStoredLevelProgress(levelProgressStorageKey)
        const resolvedStoredIndex = storedProgress
          ? Math.min(Math.max(0, storedProgress.currentActivityIndex), nextLevel.activities.length - 1)
          : 0
        const resolvedStoredHintIndex = storedProgress
          ? Math.min(
              Math.max(0, storedProgress.hintIndex),
              Math.max(0, nextLevel.activities[resolvedStoredIndex]?.hints.length - 1),
            )
          : 0

        setLevel(nextLevel)
        setCurrentActivityIndex(resolvedStoredIndex)
        setCurrentActivityMistakes(storedProgress?.currentActivityMistakes ?? 0)
        setActivityScores(storedProgress?.activityScores.slice(0, nextLevel.activities.length) ?? [])
        setEarnedStars(storedProgress?.earnedStars ?? 0)
        setHintIndex(resolvedStoredHintIndex)
        setMistakeCount(storedProgress?.mistakeCount ?? 0)
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
  }, [activeLevelTrack, currentChildProfile?.age, levelId, levelProgressStorageKey])

  useEffect(() => {
    if (loadState !== 'ready' || !level || isCompleted) {
      return
    }

    persistStoredLevelProgress(levelProgressStorageKey, {
      levelId,
      currentActivityIndex,
      currentActivityMistakes,
      activityScores,
      earnedStars,
      mistakeCount,
      hintIndex,
      totalActivityCount: level.activities.length,
    })
  }, [
    activityScores,
    currentActivityIndex,
    currentActivityMistakes,
    earnedStars,
    hintIndex,
    isCompleted,
    level,
    levelId,
    levelProgressStorageKey,
    loadState,
    mistakeCount,
  ])

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
    const nextActivityIndex = Math.min(currentActivityIndex + 1, resolvedActivityCount - 1)

    setActivityScores(nextScores)
    setEarnedStars(nextEarnedStars)
    setMistakeMessage(null)

    if (!isCurrentLevelAlreadyCompleted && resolvedStarsPerQuestion > 0) {
      addStars(resolvedStarsPerQuestion)
    }

    if (!isFinalActivity) {
      setCurrentActivityIndex(nextActivityIndex)
      setCurrentActivityMistakes(0)
      setHintIndex(0)
    }

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
        return
      }

      setIsCompleted(true)
      clearStoredLevelProgress(levelProgressStorageKey)

      const averageScore = Math.round(nextScores.reduce((total, value) => total + value, 0) / nextScores.length)
      const outcome = completeMission({
        levelId: level.id,
        levelTrack: activeLevelTrack,
        worldId: level.worldId,
        subject: level.subject,
        score: averageScore,
        xpEarned: level.rewards.xp,
        coinsEarned: level.rewards.coins,
        starsEarned: nextEarnedStars,
        starsAlreadyGranted: !isCurrentLevelAlreadyCompleted && nextEarnedStars > 0,
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
  const completedActivityCount = Math.min(activityScores.length, level.activities.length)
  const displayedStars = stars
  const hasRemainingActivities = completedActivityCount < level.activities.length
  const trackerCurrentIndex = hasRemainingActivities ? completedActivityCount : null
  const trackerFocusActivity = trackerCurrentIndex !== null ? level.activities[trackerCurrentIndex] : null
  const displayQuestionNumber = trackerCurrentIndex !== null ? trackerCurrentIndex + 1 : level.activities.length
  const activityTrail = level.activities.map((activity, index) => {
    const status =
      index < completedActivityCount ? 'completed' : trackerCurrentIndex === index ? 'current' : 'upcoming'

    return {
      activity,
      index,
      status,
      typeLabel: getActivityTypeLabel(activity.type),
      palette: getActivityTypePalette(activity.type),
    }
  })

  return (
    <ScreenLayout
      contentClassName="flex min-h-0 flex-col"
      actions={
        <div className="flex flex-col items-start gap-3">
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
            <Button onClick={() => navigate('/shop')} size="md" variant="secondary">
              <ShoppingBag className="h-5 w-5" />
              חֲנוּת
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

          <div className="flex max-w-full flex-wrap items-center gap-2 rounded-[28px] border border-white/85 bg-white/78 px-3 py-2 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur sm:min-w-[30rem]">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-lg shadow-inner"
              style={{
                background: `linear-gradient(180deg, ${currentChildProfile?.avatarSeed.bodyColor ?? '#FFD166'} 0%, #ffffff 100%)`,
              }}
            >
              ✨
            </div>
            <div className="min-w-[110px]">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400">פְּרוֹפִיל יֶלֶד</p>
              <p className="text-sm font-bold text-slate-900">{currentChildProfile?.name ?? 'חָבֵר חָדָשׁ'}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              גיל {currentChildProfile?.age ?? '--'}
            </div>
            <div className="rounded-full bg-[#eef6ff] px-3 py-2 text-xs font-semibold text-[#2563eb]">
              {getLevelTrackLabel(activeLevelTrack)}
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{xp} נ״נ</div>
            <div className="inline-flex items-center gap-1 rounded-full bg-[#fff7ed] px-3 py-2 text-xs font-bold text-[#f59e0b]">
              <Coins className="h-3.5 w-3.5" />
              {coins}
            </div>
            <div
              className={clsx(
                'inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-[#d97706] transition',
                earnedStars > 0 ? 'bg-[#fff1bf] shadow-[0_10px_24px_rgba(245,158,11,0.18)] pulse-soft' : 'bg-[#fff7d1]',
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {displayedStars}
            </div>
            <div className="rounded-full bg-[#fff7f2] px-3 py-2 text-xs font-semibold text-[#ea580c]">
              בַּשָּׁלָב: +{earnedStars}
            </div>
          </div>
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

        <div className="mx-auto grid w-full max-w-7xl gap-5 xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 xl:order-1">
            <div className="relative overflow-hidden rounded-[38px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,250,243,0.96))] p-3 shadow-[0_28px_80px_rgba(15,23,42,0.12)] sm:p-4">
              <div className="pointer-events-none absolute -left-8 top-8 h-28 w-28 rounded-full bg-[#fde6c8] blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-10 h-32 w-32 rounded-full bg-[#d9f7ee] blur-3xl" />
              <div className="pointer-events-none absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 rounded-full bg-[#ffe7ef] blur-2xl" />
              <div className="relative">
                <MiniGameHost
                  activity={currentActivity}
                  disabled={isCompleted || Boolean(successCelebration)}
                  key={currentActivity.id}
                  onMistake={handleMistake}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>

            {mistakeMessage && (
              <Card className="overflow-hidden border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,251,235,0.98))] p-0 shadow-[0_16px_36px_rgba(245,158,11,0.12)]">
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-amber-700">כִּמְעַט</p>
                    <p className="mt-1 text-base font-bold text-amber-950">{mistakeMessage}</p>
                  </div>
                  <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-amber-800 shadow-sm">
                    נִסָּיוֹנוֹת: {mistakeCount}/{level.completionRules.maxMistakes}
                  </div>
                </div>
              </Card>
            )}

            <Card className="relative overflow-hidden border-white/80 bg-white/86 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
              <div className="pointer-events-none absolute left-6 top-6 h-24 w-24 rounded-full bg-[#ffd9b5]/55 blur-2xl" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-[#c4f1e6]/55 blur-3xl" />
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd8c2] bg-[#fff7f2] px-4 py-2 text-sm font-bold text-[#ea580c]">
                    <Sparkles className="h-4 w-4" />
                    מַסְלוּל מִשְׂחָק מָלֵא הַפְתָּעוֹת
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold tracking-[0.22em] text-slate-500">עַכְשָׁיו בַּתְּחָנָה</p>
                    <h2 className="font-display text-3xl text-slate-900 sm:text-4xl">
                      שְׁאֵלָה {displayQuestionNumber} מִתּוֹךְ {level.activities.length}
                    </h2>
                    <p className="max-w-2xl text-lg font-semibold text-slate-700">
                      {trackerFocusActivity?.content.prompt ?? 'כָּל הַתְּחָנוֹת הוּשְׁלְמוּ בְּהַצְלָחָה!'}
                    </p>
                    <p className="max-w-2xl text-sm text-slate-500">
                      {trackerFocusActivity
                        ? `מַשְׂחָק ${getActivityTypeLabel(trackerFocusActivity.type)} מְחַכֶּה לָנוּ כָּעֵת.`
                        : 'אֲסַפְתֶּם אֶת כָּל הַהַצְלָחוֹת בַּשָּׁלָב הַזֶּה.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="rounded-full bg-white/90 px-4 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                      <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">הַצְלָחוֹת</p>
                      <p className="mt-1 text-lg font-black text-slate-900">
                        {completedActivityCount}/{level.activities.length}
                      </p>
                    </div>
                    <div className="rounded-full bg-[#fff7ed] px-4 py-2 shadow-[0_10px_24px_rgba(245,158,11,0.14)]">
                      <p className="text-xs font-semibold tracking-[0.18em] text-amber-700">כּוֹכָבִים</p>
                      <p className="mt-1 text-lg font-black text-[#d97706]">{earnedStars}</p>
                    </div>
                    <div className="rounded-full bg-[#effcf7] px-4 py-2 shadow-[0_10px_24px_rgba(16,185,129,0.12)]">
                      <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700">רְמָזִים</p>
                      <p className="mt-1 text-lg font-black text-emerald-900">{currentActivity.hints.length}</p>
                    </div>
                    <div className="rounded-full bg-[#fff8f0] px-4 py-2 shadow-[0_10px_24px_rgba(251,146,60,0.1)]">
                      <p className="text-xs font-semibold tracking-[0.18em] text-orange-700">נִסָּיוֹנוֹת</p>
                      <p className="mt-1 text-lg font-black text-slate-900">
                        {mistakeCount}/{level.completionRules.maxMistakes}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/80 bg-white/72 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] lg:w-[320px]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">מַפַּת הַכּוֹכָבִים</p>
                      <p className="mt-1 text-lg font-black text-slate-900">כָּכָה רוֹאִים אֵיפֹה אֲנַחְנוּ</p>
                    </div>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#d97706] shadow-inner">
                      <Flag className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activityTrail.map((entry) => (
                      <div
                        className={clsx(
                          'inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border px-3 text-sm font-black transition',
                          entry.status === 'completed' &&
                            'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_10px_24px_rgba(16,185,129,0.12)]',
                          entry.status === 'current' &&
                            'game-journey-current border-[#f26a4b] bg-[#fff1eb] text-[#ea580c] shadow-[0_16px_28px_rgba(242,106,75,0.18)]',
                          entry.status === 'upcoming' && 'border-slate-200 bg-slate-50 text-slate-400',
                        )}
                        key={entry.activity.id}
                      >
                        {entry.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : entry.index + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="order-2 border-white/80 bg-white/84 p-4 shadow-[0_22px_60px_rgba(15,23,42,0.1)] xl:order-2 xl:sticky xl:top-6 xl:max-h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">לוּחַ הַהַצְלָחוֹת</p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">רוֹאִים מָה כְּבָר הִצְלַחְנוּ</h3>
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#d97706]">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[24px] bg-[#eefcf7] px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700">כְּבָר נָכוֹן</p>
                <p className="mt-1 text-2xl font-black text-emerald-900">{completedActivityCount}</p>
              </div>
              <div className="rounded-[24px] bg-[#fff7ed] px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold tracking-[0.18em] text-amber-700">עַכְשָׁיו</p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {trackerCurrentIndex !== null ? trackerCurrentIndex + 1 : level.activities.length}
                </p>
              </div>
              <div className="rounded-[24px] bg-[#f8fafc] px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">עוֹד נִשְׁאַר</p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {Math.max(0, level.activities.length - completedActivityCount)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[28px] bg-[#f8fbff] p-3">
              <p className="text-sm font-bold text-slate-700">כָּל הַתְּחָנוֹת בַּשָּׁלָב</p>
              <div className="soft-scroll mt-3 max-h-[18rem] space-y-2 overflow-y-auto pr-1 xl:max-h-[calc(100vh-24rem)]">
                {activityTrail.map((entry) => (
                  <div
                    className={clsx(
                      'rounded-[24px] border px-4 py-3 transition',
                      entry.status === 'completed' &&
                        'border-emerald-200 bg-emerald-50/80 shadow-[0_10px_24px_rgba(16,185,129,0.08)]',
                      entry.status === 'current' &&
                        'border-[#f7c3b3] bg-[#fff4ed] shadow-[0_16px_28px_rgba(242,106,75,0.12)]',
                      entry.status === 'upcoming' && 'border-slate-200 bg-white',
                    )}
                    key={`tracker-${entry.activity.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={clsx(
                          'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                          entry.status === 'completed' && 'bg-emerald-100 text-emerald-700',
                          entry.status === 'current' && 'bg-[#ffe6dc] text-[#ea580c]',
                          entry.status === 'upcoming' && entry.palette.iconWrap,
                        )}
                      >
                        {entry.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : entry.status === 'current' ? (
                          <Flag className="h-5 w-5" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-slate-900">שְׁאֵלָה {entry.index + 1}</span>
                          <span
                            className={clsx(
                              'rounded-full border px-2.5 py-1 text-[11px] font-bold',
                              entry.palette.badge,
                            )}
                          >
                            {entry.typeLabel}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {entry.status === 'completed'
                              ? 'הִצְלַחְנוּ'
                              : entry.status === 'current'
                                ? 'מְשַׂחֲקִים עַכְשָׁיו'
                                : 'עוֹד מְעַט'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-700">{entry.activity.content.prompt}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
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
