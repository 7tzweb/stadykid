import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { BarChart3, Check, ChevronDown, Coins, House, Lock, LogIn, Move, Settings, ShoppingBag, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getWorldById, missionCatalog } from '@/game/content/catalog'
import { useGame } from '@/hooks/useGame'
import {
  buildLevelProgressStorageKey,
  loadStoredLevelProgress,
  resolveStoredLevelProgressPercent,
} from '@/services/levelProgressService'
import {
  getChallengeAgeForTrack,
  getCompletedLevelIdsForTrack,
  getLevelTrackLabel,
  getResolvedActiveLevelTrack,
  isAdvancedTrackUnlocked,
} from '@/services/levelTrackService'

const mapCanvasWidth = 1260
const mapCanvasHeight = 3000
const mapStageTopInset = 90

const stagePositions = [
  { x: 920, y: 170 },
  { x: 620, y: 400 },
  { x: 270, y: 640 },
  { x: 640, y: 880 },
  { x: 960, y: 1120 },
  { x: 600, y: 1360 },
  { x: 250, y: 1600 },
  { x: 630, y: 1840 },
  { x: 940, y: 2080 },
  { x: 590, y: 2320 },
  { x: 260, y: 2560 },
  { x: 640, y: 2800 },
] as const

const upcomingStageSeeds = [
  {
    name: 'כְּפַר הַכְּפוּלוֹת',
    subtitle: 'חֶשְׁבּוֹן מִתְקַדֵּם',
    icon: '🎪',
    accentColor: '#F59E0B',
    themeGradient: 'linear-gradient(135deg, #FFE0B2 0%, #FFF7ED 100%)',
  },
  {
    name: 'נְמַל הָאוֹתִיּוֹת',
    subtitle: 'מַסַּע קְרִיאָה חָדָשׁ',
    icon: '⚓',
    accentColor: '#FB7185',
    themeGradient: 'linear-gradient(135deg, #FFD6E0 0%, #FFF1F6 100%)',
  },
  {
    name: 'גַּן הַמִּלִּים',
    subtitle: 'תַּחֲנַת אַנְגְּלִית שְׂמֵחָה',
    icon: '🌤️',
    accentColor: '#60A5FA',
    themeGradient: 'linear-gradient(135deg, #D7E7FF 0%, #F4F8FF 100%)',
  },
  {
    name: 'גִּבְעַת הַפָּאזְלִים',
    subtitle: 'שְׁלַב חֲשִׁיבָה נוֹסָף',
    icon: '🧩',
    accentColor: '#A78BFA',
    themeGradient: 'linear-gradient(135deg, #EADFFF 0%, #F8F3FF 100%)',
  },
  {
    name: 'לָגוּנַת הַזִּיכָּרוֹן',
    subtitle: 'אֶתְגְּרֵי רִיכּוּז חֲדָשִׁים',
    icon: '🫧',
    accentColor: '#2DD4BF',
    themeGradient: 'linear-gradient(135deg, #C8FAF2 0%, #EEFFFB 100%)',
  },
  {
    name: 'קִרְקַס הַמִּסְפָּרִים',
    subtitle: 'עוֹד תַּחֲנַת לְמִידָה',
    icon: '🎠',
    accentColor: '#F97316',
    themeGradient: 'linear-gradient(135deg, #FFD8BF 0%, #FFF4EB 100%)',
  },
  {
    name: 'פִּסְגַת הַסִּיפּוּרִים',
    subtitle: 'קְרִיאָה בַּדֶּרֶךְ לַפִּסְגָּה',
    icon: '⛰️',
    accentColor: '#22C55E',
    themeGradient: 'linear-gradient(135deg, #D4F7D8 0%, #F2FFF4 100%)',
  },
] as const

type DragState = {
  pointerId: number
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
}

function buildMapPath(points: ReadonlyArray<{ x: number; y: number }>) {
  if (!points.length) {
    return ''
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }

    const previousPoint = points[index - 1]
    const controlY = Math.round((previousPoint.y + point.y) / 2)

    return `${path} C ${previousPoint.x} ${controlY} ${point.x} ${controlY} ${point.x} ${point.y}`
  }, '')
}

function getMissionProgress(levelId: string, completedLevelIds: string[], partialProgress: number) {
  const isCompleted = completedLevelIds.includes(levelId)

  return {
    isCompleted,
    progress: isCompleted ? 100 : partialProgress,
  }
}

function isStageButtonTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(target.closest('[data-map-stage-button="true"]'))
}

export function WorldMapScreen() {
  const supportsTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0
  const navigate = useNavigate()
  const {
    childProfiles,
    coins,
    currentChildProfile,
    currentUser,
    experienceMode,
    isAdminMode,
    setCurrentChildProfile,
    stars,
    xp,
  } = useGame()
  const mapViewportRef = useRef<HTMLDivElement | null>(null)
  const mapCardRef = useRef<HTMLDivElement | null>(null)
  const profileSwitcherRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [mapCardHeight, setMapCardHeight] = useState<number | null>(null)
  const activeLevelTrack = getResolvedActiveLevelTrack(currentChildProfile)
  const completedLevelIds = getCompletedLevelIdsForTrack(currentChildProfile, activeLevelTrack)
  const challengeAge = getChallengeAgeForTrack(currentChildProfile?.age, activeLevelTrack)
  const advancedTrackUnlocked = isAdvancedTrackUnlocked(currentChildProfile)
  const sortedChildProfiles = [...childProfiles].sort((left, right) => left.age - right.age)
  const isDemoProfileMode = isAdminMode

  useEffect(() => {
    if (!isAdminMode && !currentUser) {
      navigate('/auth')
      return
    }

    if (!currentChildProfile) {
      navigate('/profiles')
    }
  }, [currentChildProfile, currentUser, isAdminMode, navigate])

  useEffect(() => {
    const viewport = mapViewportRef.current

    if (!viewport) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      viewport.scrollLeft = Math.max(0, (mapCanvasWidth - viewport.clientWidth) / 2)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    function updateMapCardHeight() {
      const card = mapCardRef.current

      if (!card) {
        return
      }

      const availableHeight = window.innerHeight - card.getBoundingClientRect().top - 20
      setMapCardHeight(Math.max(540, Math.round(availableHeight)))
    }

    updateMapCardHeight()
    window.addEventListener('resize', updateMapCardHeight)

    return () => window.removeEventListener('resize', updateMapCardHeight)
  }, [])

  useEffect(() => {
    function handleOutsidePointerDown(event: PointerEvent) {
      if (!profileSwitcherRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handleOutsidePointerDown)

    return () => window.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [])

  const adventureStages = stagePositions.map((position, index) => {
    const mission = missionCatalog[index]

    if (mission) {
      const world = getWorldById(mission.worldId)
      const storedLevelProgress = loadStoredLevelProgress(
        buildLevelProgressStorageKey(experienceMode, currentChildProfile?.id, mission.levelId, activeLevelTrack),
      )
      const partialProgress = resolveStoredLevelProgressPercent(storedLevelProgress, 30)
      const { isCompleted, progress } = getMissionProgress(mission.levelId, completedLevelIds, partialProgress)
      const previousMission = missionCatalog[index - 1]
      const isUnlocked =
        isCompleted ||
        !previousMission ||
        completedLevelIds.includes(previousMission.levelId)

      return {
        id: mission.id,
        stageNumber: index + 1,
        x: position.x,
        y: position.y + mapStageTopInset,
        label: mission.name,
        subtitle: world?.name ?? 'שָׁלָב לְמִידָה',
        icon: mission.icon,
        accentColor: world?.accentColor ?? '#94A3B8',
        themeGradient: world?.themeGradient ?? 'linear-gradient(135deg, #E2E8F0 0%, #F8FAFC 100%)',
        isUnlocked,
        isPlayable: true,
        progress,
        isCompleted,
        levelId: mission.levelId,
        questionCount: 30,
      }
    }

    const upcomingStage = upcomingStageSeeds[index - missionCatalog.length]

      return {
        id: `upcoming-stage-${index + 1}`,
        stageNumber: index + 1,
        x: position.x,
        y: position.y + mapStageTopInset,
      label: upcomingStage?.name ?? `שָׁלָב ${index + 1}`,
      subtitle: upcomingStage?.subtitle ?? 'שָׁלָב חָדָשׁ יַגִּיעַ בְּהֶמְשֵׁךְ',
      icon: upcomingStage?.icon ?? '✨',
      accentColor: upcomingStage?.accentColor ?? '#94A3B8',
      themeGradient: upcomingStage?.themeGradient ?? 'linear-gradient(135deg, #E2E8F0 0%, #F8FAFC 100%)',
      isUnlocked: false,
      isPlayable: false,
      progress: 0,
      isCompleted: false,
      levelId: null,
      questionCount: 0,
    }
  })

  const mapPath = buildMapPath(adventureStages.map((stage) => ({ x: stage.x, y: stage.y })))

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (supportsTouch) {
      return
    }

    if (isStageButtonTarget(event.target)) {
      return
    }

    const viewport = mapViewportRef.current

    if (!viewport) {
      return
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    }

    viewport.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (supportsTouch) {
      return
    }

    const viewport = mapViewportRef.current
    const dragState = dragStateRef.current

    if (!viewport || !dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    viewport.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.startX)
    viewport.scrollTop = dragState.scrollTop - (event.clientY - dragState.startY)
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (supportsTouch) {
      return
    }

    const viewport = mapViewportRef.current
    const dragState = dragStateRef.current

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId)
    }

    dragStateRef.current = null
    setIsDragging(false)
  }

  return (
    <ScreenLayout
      contentClassName="flex min-h-0 flex-col overflow-hidden"
      title="מַפַּת הַהַרְפַּתְקָה"
      tone="sky"
      actions={
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div className="flex flex-wrap gap-3">
            <Button
              className="px-7 text-base shadow-[0_20px_44px_rgba(242,106,75,0.36)]"
              onClick={() => navigate('/home')}
              size="lg"
              variant="primary"
            >
              <House className="h-5 w-5" />
              עוֹלַם הַגּוּרִים
            </Button>
            <Button onClick={() => navigate('/progress')} size="md" variant="secondary">
              <BarChart3 className="h-5 w-5" />
              הַהִתְקַדְּמוּת שֶׁלִּי
            </Button>
            <Button onClick={() => navigate('/shop')} size="md" variant="secondary">
              <ShoppingBag className="h-5 w-5" />
              חֲנוּת
            </Button>
            <Button onClick={() => navigate('/auth')} size="md" variant="secondary">
              <LogIn className="h-5 w-5" />
              מָסַךְ חִבּוּר
            </Button>
            <Button onClick={() => navigate('/settings')} size="md" variant="secondary">
              <Settings className="h-5 w-5" />
              הַגְדָּרוֹת
            </Button>
          </div>

          <div className="relative self-end" ref={profileSwitcherRef}>
            <div className="flex flex-wrap items-center gap-2 rounded-[28px] border border-white/85 bg-white/78 px-3 py-2 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur">
              <button
                className="flex items-center gap-3 rounded-[22px] px-1 py-1 text-right transition hover:bg-slate-100/80"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                type="button"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-lg shadow-inner"
                  style={{
                    background: `linear-gradient(180deg, ${currentChildProfile?.avatarSeed.bodyColor ?? '#FFD166'} 0%, #ffffff 100%)`,
                  }}
                >
                  ✨
                </div>
                <div className="min-w-[110px]">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400">
                    {isDemoProfileMode ? 'פְּרוֹפִילֵי אַדְמִין' : 'פְּרוֹפִיל יֶלֶד'}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {currentChildProfile?.name ?? 'חָבֵר חָדָשׁ'}
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                  גיל {currentChildProfile?.age ?? '--'}
                </div>
                <div className="rounded-full bg-[#eef6ff] px-3 py-2 text-xs font-semibold text-[#2563eb]">
                  {getLevelTrackLabel(activeLevelTrack)}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{xp} נ״נ</div>
              <div className="inline-flex items-center gap-1 rounded-full bg-[#fff7ed] px-3 py-2 text-xs font-bold text-[#f59e0b]">
                <Coins className="h-3.5 w-3.5" />
                {coins}
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-[#fff7d1] px-3 py-2 text-xs font-bold text-[#d97706]">
                <Sparkles className="h-3.5 w-3.5" />
                {stars}
              </div>
            </div>

            {isProfileMenuOpen && (
              <div className="absolute left-0 top-[calc(100%+12px)] z-40 w-[320px] max-w-[calc(100vw-2rem)] rounded-[28px] border border-white/85 bg-white/96 p-3 shadow-[0_24px_52px_rgba(15,23,42,0.16)] backdrop-blur">
                <div className="mb-3 px-2">
                  <p className="text-sm font-bold text-slate-900">מחליפים פרופיל לבדיקה</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {experienceMode === 'admin'
                      ? 'כרגע אלה פרופילי דמו לפי גיל לבדיקת כל השאלות והשלבים.'
                      : 'אלה פרופילי הילדים של המשתמש המחובר. כאן מחליפים בין הילדים שנוצרו בחשבון.'}
                  </p>
                </div>

                <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                  {sortedChildProfiles.map((profile) => {
                    const isActive = profile.id === currentChildProfile?.id

                    return (
                      <button
                        className={`flex w-full items-center justify-between gap-3 rounded-[22px] px-3 py-3 text-right transition ${
                          isActive ? 'bg-[#eef6ff] shadow-sm' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                        key={profile.id}
                        onClick={() => {
                          setCurrentChildProfile(profile.id)
                          setIsProfileMenuOpen(false)
                        }}
                        type="button"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-sm shadow-inner"
                            style={{
                              background: `linear-gradient(180deg, ${profile.avatarSeed.bodyColor} 0%, #ffffff 100%)`,
                            }}
                          >
                            ✨
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{profile.name}</p>
                            <p className="text-xs text-slate-500">
                              גיל {profile.age} · {profile.favoriteSubject}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive && <Check className="h-4 w-4 text-[#2563eb]" />}
                          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                            {getCompletedLevelIdsForTrack(profile, getResolvedActiveLevelTrack(profile)).length}/{missionCatalog.length}{' '}
                            {getLevelTrackLabel(getResolvedActiveLevelTrack(profile))}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <Card
          className="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
          ref={mapCardRef}
          style={mapCardHeight ? { height: `${mapCardHeight}px` } : undefined}
        >
          <div className="flex flex-col gap-4 border-b border-white/70 bg-white/65 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="sm:max-w-[42rem]">
              <h2 className="font-display text-2xl text-slate-900">12 תַּחֲנוֹת עַל הַמַּפָּה</h2>
              <p className="mt-1 text-sm text-slate-500">
                {activeLevelTrack === 'advanced'
                  ? isAdminMode
                    ? `הַסְּבָב הַמִּתְקַדֵּם פָּתוּחַ. כָּאן רוֹאִים שׁוּב אֶת כָּל הַשְּׁלָבִים בְּרָמַת גִּיל ${challengeAge}.`
                    : 'הַסְּבָב הַמִּתְקַדֵּם פָּתוּחַ. כָּאן נִפְתָּחִים שׁוּב כָּל הַשְּׁלָבִים בְּרָמָה מְאַתְגֶּרֶת יוֹתֵר.'
                  : `אֶפְשָׁר לִגְרֹר עִם הָעַכְבָּר אוֹ לִגְלֹל כְּדֵי לִרְאוֹת שְׁלָבִים נוֹסָפִים בְּלִי חֲפִיפוֹת.${
                      advancedTrackUnlocked ? ' אַחֲרֵי סִיּוּם כָּל 10 הַשְּׁלָבִים יִפָּתַח גַּם סְבָב מִתְקַדֵּם.' : ''
                    }`}
              </p>
            </div>
            <div className="flex max-w-full items-center gap-3 self-start rounded-full border border-[#ffd9cf] bg-white/94 px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_10px_20px_rgba(242,106,75,0.08)] sm:max-w-[32rem] sm:self-center">
              <Move className="h-4 w-4 text-[#f26a4b]" />
              <span className="whitespace-normal leading-5">
                {supportsTouch ? 'מַחְלִיקִים עִם הָאֶצְבַּע כְּדֵי לִרְאוֹת עוֹד בַּמַּפָּה' : 'גִּרְרוּ אוֹ הַחְלִיקוּ כְּדֵי לִרְאוֹת עוֹד בַּמַּפָּה'}
              </span>
            </div>
          </div>

          <div
            className={`relative flex-1 overflow-auto overscroll-contain bg-[radial-gradient(circle_at_top,#ffffff_0%,#f7f9ff_52%,#edf2ff_100%)] ${
              supportsTouch ? '' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onPointerCancel={finishPointerDrag}
            onPointerDown={handlePointerDown}
            onPointerLeave={finishPointerDrag}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerDrag}
            ref={mapViewportRef}
            style={{ WebkitOverflowScrolling: 'touch', touchAction: supportsTouch ? 'pan-x pan-y' : 'none' }}
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#edf2ff] via-[#edf2ff]/75 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#edf2ff] via-[#edf2ff]/75 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-[#edf2ff] via-[#edf2ff]/78 to-transparent" />

            <div className="pointer-events-none absolute bottom-6 left-6 z-20 flex max-w-[calc(100%_-_3rem)] items-center gap-2 rounded-full bg-[#f26a4b]/12 px-4 py-2 text-sm font-semibold text-[#d45d3f] shadow-[0_14px_28px_rgba(242,106,75,0.14)]">
              <ChevronDown className="h-4 w-4 animate-bounce" />
              יֵשׁ עוֹד שְׁלָבִים לְמַטָּה
            </div>

            <div className="relative" style={{ height: `${mapCanvasHeight}px`, width: `${mapCanvasWidth}px` }}>
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 ${mapCanvasWidth} ${mapCanvasHeight}`}
              >
                <path
                  d={mapPath}
                  fill="none"
                  stroke="#f26a4b"
                  strokeDasharray="18 20"
                  strokeLinecap="round"
                  strokeWidth="18"
                  opacity="0.22"
                />

                {adventureStages.map((stage) => (
                  <circle
                    cx={stage.x}
                    cy={stage.y}
                    fill="#ffffff"
                    key={`node-${stage.id}`}
                    opacity="0.95"
                    r="18"
                    stroke={stage.accentColor}
                    strokeWidth="6"
                  />
                ))}
              </svg>

              {adventureStages.map((stage) => {
                const previousStageNumber = Math.max(1, stage.stageNumber - 1)
                const isClickable = stage.isPlayable && stage.isUnlocked && stage.levelId

                return (
                  <button
                    className={`absolute w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-[34px] border border-white/85 p-5 text-right shadow-[0_20px_50px_rgba(15,23,42,0.12)] transition ${
                      isClickable ? 'pulse-soft hover:scale-[1.02]' : 'cursor-default'
                    }`}
                    data-map-stage-button="true"
                    disabled={!isClickable}
                    key={stage.id}
                    onClick={() => stage.levelId && navigate(`/game/${stage.levelId}`)}
                    style={{
                      background: stage.isPlayable
                        ? stage.isUnlocked
                          ? stage.themeGradient
                          : 'linear-gradient(135deg, #e5e7eb 0%, #f8fafc 100%)'
                        : stage.themeGradient,
                      left: `${stage.x}px`,
                      minHeight: '238px',
                      opacity: stage.isUnlocked ? 1 : 0.9,
                      top: `${stage.y}px`,
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full bg-white/80 px-3 py-2 text-xs font-bold text-slate-500">
                          שלב {String(stage.stageNumber).padStart(2, '0')}
                        </span>
                        <p className="mt-4 text-4xl">{stage.icon}</p>
                        <h3 className="mt-3 font-display text-2xl text-slate-900">{stage.label}</h3>
                        <p className="mt-2 text-sm text-slate-600">{stage.subtitle}</p>
                      </div>
                      <span className="rounded-full bg-white/80 px-3 py-2 text-xs font-bold text-slate-600">
                        {stage.isPlayable ? (stage.isUnlocked ? 'פָּתוּחַ' : 'נָעוּל') : 'בְּקָרוֹב'}
                      </span>
                    </div>

                    <div className="mt-5">
                      {stage.isPlayable ? (
                        <div className="space-y-3">
                          <ProgressBar
                            accent={stage.accentColor}
                            label="הַשְׁלָמָה"
                            value={stage.progress}
                            valueLabel={`${stage.progress}%`}
                          />
                          <div className="rounded-[22px] bg-white/82 px-4 py-3 text-sm font-semibold text-slate-700">
                            {isAdminMode
                              ? `${stage.questionCount} שְׁאֵלוֹת בְּרָמַת גִּיל ${challengeAge}`
                              : `${stage.questionCount} שְׁאֵלוֹת מֻתְאָמוֹת לַשָּׁלָב הַנּוֹכְחִי`}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-[22px] bg-white/75 px-4 py-3 text-sm font-semibold text-slate-600">
                          שלב עתידי שמור למפה וייפתח בהמשך.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-[22px] bg-white/75 px-4 py-3 text-sm font-semibold text-slate-700">
                      {stage.isPlayable ? (
                        stage.isUnlocked ? (
                          stage.isCompleted ? (
                            'הַשָּׁלָב הֻשְׁלַם. אֶפְשָׁר לְהִכָּנֵס שׁוּב וּלְשַׂחֵק.'
                          ) : (
                            'נִכְנָסִים יָשִׁיר לִשְׁלָב שֶׁל 30 שְׁאֵלוֹת.'
                          )
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            מַשְׁלִימִים אֶת שְׁלָב {String(previousStageNumber).padStart(2, '0')} כְּדֵי לִפְתֹּחַ
                          </span>
                        )
                      ) : (
                        'כָּרֶגַע מֻצָּג עַל הַמַּפָּה כְּהֶמְשֵׁךְ הַמַּסְלוּל.'
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </Card>
      </div>
    </ScreenLayout>
  )
}
