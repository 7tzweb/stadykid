import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import {
  BarChart3,
  Check,
  Coins,
  Droplets,
  Gamepad2,
  Heart,
  Map as MapIcon,
  Milk,
  MoonStar,
  PawPrint,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  formatCountdown,
  getCreatureById,
  getCreatureNeedState,
  getCurrentCreatureStage,
  getOwnedCreatureById,
  isCreatureHatched,
} from '@/game/content/creatures'
import { getShopItemById } from '@/game/content/catalog'
import { useGame } from '@/hooks/useGame'
import type { CreatureCareAction } from '@/types/models'

type HomePanel = 'creatures' | 'food' | 'style' | null
type FoodMode = 'feed' | 'drink'

interface SceneCreature {
  creatureId: string
  x: number
  y: number
  directionX: 1 | -1
  directionY: 1 | -1
  speedX: number
  speedY: number
  pauseTicks: number
  walkTicks: number
  phase: number
}

interface DragTrayItem {
  id: string
  emoji: string
  x: number
  y: number
}

interface CareBurstState {
  creatureId: string
  action: CreatureCareAction
}

interface CreatureReactionState {
  creatureId: string
  emoji: string
}

const foodItems = {
  feed: [
    { id: 'strawberry', emoji: '🍓' },
    { id: 'honey', emoji: '🍯' },
    { id: 'cookie', emoji: '🍪' },
    { id: 'apple', emoji: '🍎' },
  ],
  drink: [
    { id: 'milk', emoji: '🥛' },
    { id: 'water', emoji: '💧' },
    { id: 'juice', emoji: '🧃' },
    { id: 'tea', emoji: '🫖' },
  ],
} satisfies Record<FoodMode, Array<{ id: string; emoji: string }>>

const careIcons = {
  feed: Milk,
  pet: Heart,
  play: Gamepad2,
  rest: MoonStar,
} satisfies Record<CreatureCareAction, typeof Heart>

const careBubbleClasses = {
  feed: 'bg-white/94 text-[#2563eb]',
  pet: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(254,226,226,0.96))] text-[#e11d48]',
  play: 'bg-white/94 text-[#7c3aed]',
  rest: 'bg-white/94 text-[#0f766e]',
} satisfies Record<CreatureCareAction, string>

const equippedItemPositions = [
  { right: '-8px', top: '8px' },
  { left: '-8px', top: '8px' },
  { right: '-10px', top: '34px' },
  { left: '-10px', top: '34px' },
] as const

function hashCreatureId(input: string) {
  return input.split('').reduce((total, character) => total + character.charCodeAt(0), 0)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getFillClipPath(progress: number) {
  return `inset(${(1 - progress) * 100}% 0 0 0)`
}

function createSceneCreature(creatureId: string): SceneCreature {
  const hash = hashCreatureId(creatureId)

  return {
    creatureId,
    x: 14 + (hash % 64),
    y: 26 + (hash % 34),
    directionX: hash % 2 === 0 ? 1 : -1,
    directionY: hash % 3 === 0 ? 1 : -1,
    speedX: 0.12 + (hash % 3) * 0.03,
    speedY: 0.07 + (hash % 2) * 0.03,
    pauseTicks: 0,
    walkTicks: 12 + (hash % 8),
    phase: hash % 24,
  }
}

function WorldIconButton({
  active = false,
  children,
  onClick,
  title,
}: {
  active?: boolean
  children: ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      aria-label={title}
      className={`flex h-14 w-14 items-center justify-center rounded-full border border-white/90 shadow-[0_18px_40px_rgba(56,37,87,0.18)] backdrop-blur transition hover:scale-[1.03] ${
        active
          ? 'bg-[linear-gradient(180deg,rgba(255,241,251,0.98),rgba(250,221,243,0.9))] ring-2 ring-[#f472b6]'
          : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,238,255,0.88))]'
      }`}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  )
}

export function PetHomeScreen() {
  const navigate = useNavigate()
  const {
    coins,
    inventory,
    ownedCreatures,
    stars,
    toggleCreatureItem,
    toggleCreaturePlacement,
    careForCreature,
  } = useGame()
  const [now, setNow] = useState(() => Date.now())
  const [openPanel, setOpenPanel] = useState<HomePanel>(null)
  const [foodMode, setFoodMode] = useState<FoodMode>('feed')
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(ownedCreatures[0]?.creatureId ?? null)
  const [sceneCreatures, setSceneCreatures] = useState<SceneCreature[]>([])
  const [draggedTrayItem, setDraggedTrayItem] = useState<DragTrayItem | null>(null)
  const [draggedCreatureId, setDraggedCreatureId] = useState<string | null>(null)
  const [careBurst, setCareBurst] = useState<CareBurstState | null>(null)
  const [reactionBubble, setReactionBubble] = useState<CreatureReactionState | null>(null)
  const [heartProgressByCreatureId, setHeartProgressByCreatureId] = useState<Record<string, number>>({})
  const [feedProgressByCreatureId, setFeedProgressByCreatureId] = useState<Record<string, number>>({})
  const [starRewardCreatureId, setStarRewardCreatureId] = useState<string | null>(null)
  const announcedHatchRef = useRef(new Set<string>())
  const heartProgressRef = useRef<Record<string, number>>({})
  const feedProgressRef = useRef<Record<string, number>>({})
  const sceneRef = useRef<HTMLDivElement | null>(null)

  const homeCreatures = ownedCreatures.filter((creature) => creature.placedInHome)
  const wearableItems = inventory
    .map((itemId) => getShopItemById(itemId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const resolvedSelectedCreatureId = ownedCreatures.some((creature) => creature.creatureId === selectedCreatureId)
    ? selectedCreatureId
    : ownedCreatures[0]?.creatureId ?? null

  const selectedOwnedCreature =
    getOwnedCreatureById(resolvedSelectedCreatureId ?? '', ownedCreatures) ?? ownedCreatures[0] ?? null
  const selectedCreature = selectedOwnedCreature ? getCreatureById(selectedOwnedCreature.creatureId) ?? null : null
  const selectedIsHatched =
    selectedCreature && selectedOwnedCreature ? isCreatureHatched(selectedCreature, selectedOwnedCreature, now) : false

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!careBurst) {
      return
    }

    const timer = window.setTimeout(() => setCareBurst(null), 820)

    return () => window.clearTimeout(timer)
  }, [careBurst])

  useEffect(() => {
    if (!starRewardCreatureId) {
      return
    }

    const timer = window.setTimeout(() => setStarRewardCreatureId(null), 1100)

    return () => window.clearTimeout(timer)
  }, [starRewardCreatureId])

  useEffect(() => {
    if (!reactionBubble) {
      return
    }

    const timer = window.setTimeout(() => setReactionBubble(null), 920)

    return () => window.clearTimeout(timer)
  }, [reactionBubble])

  useEffect(() => {
    const activeCreatureIds = ownedCreatures
      .filter((creature) => creature.placedInHome)
      .map((creature) => creature.creatureId)

    const timer = window.setTimeout(() => {
      setSceneCreatures((current) => {
        const byId = new globalThis.Map(current.map((entry) => [entry.creatureId, entry] as const))

        return activeCreatureIds.map((creatureId) => byId.get(creatureId) ?? createSceneCreature(creatureId))
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [ownedCreatures])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneCreatures((current) =>
        current.map((entry) => {
          const ownedCreature = getOwnedCreatureById(entry.creatureId, ownedCreatures)
          const creature = getCreatureById(entry.creatureId)
          const hatched = creature && ownedCreature ? isCreatureHatched(creature, ownedCreature, Date.now()) : false
          const nextPhase = (entry.phase + 1) % 24

          if (!hatched) {
            return {
              ...entry,
              phase: nextPhase,
            }
          }

          if (draggedCreatureId === entry.creatureId) {
            return {
              ...entry,
              phase: nextPhase,
            }
          }

          if (entry.pauseTicks > 0) {
            const nextPauseTicks = entry.pauseTicks - 1

            return {
              ...entry,
              pauseTicks: nextPauseTicks,
              walkTicks: nextPauseTicks === 0 ? 10 + Math.floor(Math.random() * 9) : entry.walkTicks,
              directionX:
                nextPauseTicks === 0 && Math.random() < 0.28
                  ? ((entry.directionX * -1) as 1 | -1)
                  : entry.directionX,
              directionY:
                nextPauseTicks === 0 && Math.random() < 0.2
                  ? ((entry.directionY * -1) as 1 | -1)
                  : entry.directionY,
              phase: nextPhase,
            }
          }

          const nextX = entry.x + entry.directionX * entry.speedX
          const nextY = entry.y + entry.directionY * entry.speedY
          const hitEdgeX = nextX < 8 || nextX > 92
          const hitEdgeY = nextY < 18 || nextY > 78
          const nextWalkTicks = entry.walkTicks - 1
          const shouldPause = nextWalkTicks <= 0 || Math.random() < 0.07

          return {
            ...entry,
            x: clamp(nextX, 8, 92),
            y: clamp(nextY, 18, 78),
            directionX: hitEdgeX ? (nextX < 8 ? 1 : -1) : entry.directionX,
            directionY: hitEdgeY ? (nextY < 18 ? 1 : -1) : entry.directionY,
            pauseTicks: hitEdgeX || hitEdgeY || shouldPause ? 5 + Math.floor(Math.random() * 7) : 0,
            walkTicks: hitEdgeX || hitEdgeY || shouldPause ? 12 + Math.floor(Math.random() * 8) : nextWalkTicks,
            phase: nextPhase,
          }
        }),
      )
    }, 260)

    return () => window.clearInterval(timer)
  }, [draggedCreatureId, ownedCreatures])

  useEffect(() => {
    ownedCreatures.forEach((ownedCreature) => {
      const creature = getCreatureById(ownedCreature.creatureId)

      if (!creature || !isCreatureHatched(creature, ownedCreature, now) || announcedHatchRef.current.has(ownedCreature.creatureId)) {
        return
      }

      announcedHatchRef.current.add(ownedCreature.creatureId)
      setCareBurst({ creatureId: ownedCreature.creatureId, action: 'play' })
    })
  }, [now, ownedCreatures])

  function triggerCareAction(creatureId: string, action: CreatureCareAction) {
    const ownedCreature = getOwnedCreatureById(creatureId, ownedCreatures)
    const creature = getCreatureById(creatureId)

    if (!ownedCreature || !creature || !isCreatureHatched(creature, ownedCreature, now)) {
      return false
    }

    const needs = getCreatureNeedState(creature, ownedCreature, now)
    const dueEntry = needs.entries.find((entry) => entry.action === action)
    const rewardStars = dueEntry?.isDue ? creature.needs.rewardStars[action] : 0
    const didCare = careForCreature(creatureId, action, rewardStars)

    if (!didCare) {
      return false
    }

    setSelectedCreatureId(creatureId)
    setCareBurst({ creatureId, action })

    return true
  }

  function updateHeartProgress(creatureId: string, progress: number) {
    heartProgressRef.current = {
      ...heartProgressRef.current,
      [creatureId]: progress,
    }

    setHeartProgressByCreatureId((current) => ({
      ...current,
      [creatureId]: progress,
    }))
  }

  function updateFeedProgress(creatureId: string, progress: number) {
    feedProgressRef.current = {
      ...feedProgressRef.current,
      [creatureId]: progress,
    }

    setFeedProgressByCreatureId((current) => ({
      ...current,
      [creatureId]: progress,
    }))
  }

  function showReaction(creatureId: string, emoji: string) {
    setReactionBubble({ creatureId, emoji })
  }

  function handlePetCreature(creatureId: string) {
    const ownedCreature = getOwnedCreatureById(creatureId, ownedCreatures)
    const creature = getCreatureById(creatureId)

    if (!ownedCreature || !creature || !isCreatureHatched(creature, ownedCreature, now)) {
      return
    }

    const petNeed = getCreatureNeedState(creature, ownedCreature, now).entries.find((entry) => entry.action === 'pet')

    if (!petNeed?.isDue) {
      return
    }

    setSelectedCreatureId(creatureId)
    setCareBurst({ creatureId, action: 'pet' })

    const currentProgress = heartProgressRef.current[creatureId] ?? 0
    const nextProgress = Math.min(1, currentProgress + 1 / Math.max(1, creature.needs.pettingRewardClicks))

    updateHeartProgress(creatureId, nextProgress)

    if (nextProgress < 0.999) {
      return
    }

    if (careForCreature(creatureId, 'pet', 1)) {
      setStarRewardCreatureId(creatureId)
    }

    window.setTimeout(() => updateHeartProgress(creatureId, 0), 380)
  }

  function handleFeedCreature(creatureId: string) {
    const ownedCreature = getOwnedCreatureById(creatureId, ownedCreatures)
    const creature = getCreatureById(creatureId)

    if (!ownedCreature || !creature || !isCreatureHatched(creature, ownedCreature, now)) {
      return false
    }

    const feedNeed = getCreatureNeedState(creature, ownedCreature, now).entries.find((entry) => entry.action === 'feed')

    if (!feedNeed?.isDue) {
      return false
    }

    const nextFeedCount = ownedCreature.care.feedCount + 1
    const rewardStars =
      nextFeedCount % Math.max(1, creature.needs.feedingRewardEveryCount) === 0 ? 1 : 0

    setSelectedCreatureId(creatureId)
    setCareBurst({ creatureId, action: 'feed' })
    const currentProgress = feedProgressRef.current[creatureId] ?? 0
    const nextProgress = Math.min(1, currentProgress + 1 / Math.max(1, creature.needs.feedingFillItems))

    updateFeedProgress(creatureId, nextProgress)

    if (nextProgress < 0.999) {
      return true
    }

    const didFeed = careForCreature(creatureId, 'feed', rewardStars)

    if (!didFeed) {
      return false
    }

    showReaction(creatureId, '😊')

    if (rewardStars > 0) {
      setStarRewardCreatureId(creatureId)
    }

    window.setTimeout(() => updateFeedProgress(creatureId, 0), 520)

    return true
  }

  function handleNeedBubble(creatureId: string, action: CreatureCareAction) {
    setSelectedCreatureId(creatureId)

    if (action === 'feed') {
      setFoodMode('feed')
      setOpenPanel('food')
      return
    }

    triggerCareAction(creatureId, action)
  }

  function handleCreaturePlacement(creatureId: string) {
    toggleCreaturePlacement(creatureId)
    setSelectedCreatureId(creatureId)
  }

  function handleWearableItem(itemId: string) {
    if (!selectedCreature || !selectedOwnedCreature || !selectedIsHatched) {
      return
    }

    toggleCreatureItem(selectedCreature.id, itemId)
    setCareBurst({ creatureId: selectedCreature.id, action: 'play' })
  }

  function handleStartDragging(event: ReactPointerEvent<HTMLButtonElement>, item: { id: string; emoji: string }) {
    event.preventDefault()
    setDraggedTrayItem({
      ...item,
      x: event.clientX,
      y: event.clientY,
    })
  }

  const resolveFoodDrop = useEffectEvent((clientX: number, clientY: number) => {
    const element = document.elementFromPoint(clientX, clientY)
    const dropTarget =
      element instanceof HTMLElement ? (element.closest('[data-drop-creature-id]') as HTMLElement | null) : null
    const creatureId = dropTarget?.dataset.dropCreatureId

    if (!creatureId) {
      return
    }

    handleFeedCreature(creatureId)
  })

  function moveCreatureToPointer(creatureId: string, clientX: number, clientY: number) {
    const sceneBounds = sceneRef.current?.getBoundingClientRect()

    if (!sceneBounds) {
      return
    }

    const x = ((clientX - sceneBounds.left) / sceneBounds.width) * 100
    const y = ((clientY - sceneBounds.top) / sceneBounds.height) * 100

    setSceneCreatures((current) =>
      current.map((entry) =>
        entry.creatureId === creatureId
          ? {
              ...entry,
              x: clamp(x, 8, 92),
              y: clamp(y, 18, 78),
            }
          : entry,
      ),
    )
  }

  function handleStartDraggingCreature(event: ReactPointerEvent<HTMLButtonElement>, creatureId: string) {
    event.preventDefault()
    event.stopPropagation()
    setSelectedCreatureId(creatureId)

    const startX = event.clientX
    const startY = event.clientY
    let moved = false

    function handlePointerMove(moveEvent: PointerEvent) {
      if (!moved && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > 14) {
        moved = true
        setDraggedCreatureId(creatureId)
      }

      if (moved) {
        moveCreatureToPointer(creatureId, moveEvent.clientX, moveEvent.clientY)
      }
    }

    function handlePointerEnd() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
      setDraggedCreatureId(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)
  }

  useEffect(() => {
    if (!draggedTrayItem) {
      return
    }

    function handlePointerMove(event: PointerEvent) {
      setDraggedTrayItem((current) =>
        current
          ? {
              ...current,
              x: event.clientX,
              y: event.clientY,
            }
          : current,
      )
    }

    function handlePointerUp(event: PointerEvent) {
      if (!draggedTrayItem) {
        return
      }

      resolveFoodDrop(event.clientX, event.clientY)
      setDraggedTrayItem(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [draggedTrayItem])

  return (
    <div
      className="relative h-[100dvh] w-screen overflow-hidden bg-[#f7f1ff]"
      ref={sceneRef}
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04)), url(/assets/world/playroom-bg1.png)',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.22)_0%,_rgba(255,255,255,0)_28%,_rgba(255,244,228,0.12)_100%)]" />

      <div className="absolute inset-x-0 top-4 z-40 flex justify-center px-4">
        <button
          className="flex items-center gap-3 rounded-full border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,239,247,0.92))] px-5 py-3 shadow-[0_20px_50px_rgba(56,37,87,0.2)] backdrop-blur transition hover:scale-[1.02]"
          onClick={() => navigate('/worlds')}
          type="button"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ff8aa5_0%,#f26a4b_100%)] text-white shadow-[0_12px_30px_rgba(242,106,75,0.28)]">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-slate-900">משחקים</p>
            <div className="mt-1 flex items-center justify-end gap-2 text-[12px] font-bold text-slate-600">
              <span>⭐</span>
              <span>🐾</span>
            </div>
          </div>
        </button>
      </div>

      <div className="absolute left-4 top-4 z-40 flex items-center gap-2 rounded-full border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(243,238,255,0.88))] p-2 shadow-[0_20px_50px_rgba(56,37,87,0.18)] backdrop-blur-xl">
        <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-3 text-sm font-bold text-[#b45309] shadow-[0_12px_30px_rgba(84,60,126,0.08)]">
          <Sparkles className="h-4 w-4" />
          {stars}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-3 text-sm font-bold text-[#f59e0b] shadow-[0_12px_30px_rgba(84,60,126,0.08)]">
          <Coins className="h-4 w-4" />
          {coins}
        </div>
      </div>

      <div className="absolute right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(243,238,255,0.88))] p-2 shadow-[0_20px_50px_rgba(56,37,87,0.18)] backdrop-blur-xl">
        <WorldIconButton onClick={() => navigate('/worlds')} title="עולם השאלות">
          <MapIcon className="h-6 w-6 text-[#f26a4b]" />
        </WorldIconButton>
        <WorldIconButton onClick={() => navigate('/shop')} title="חנות">
          <ShoppingBag className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
        <WorldIconButton onClick={() => navigate('/progress')} title="התקדמות">
          <BarChart3 className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
        <WorldIconButton onClick={() => navigate('/settings')} title="הגדרות">
          <Settings className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
      </div>

      <div className="absolute bottom-4 left-4 z-40 flex items-center gap-3 rounded-full border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(243,238,255,0.88))] p-2 shadow-[0_20px_50px_rgba(56,37,87,0.18)] backdrop-blur-xl">
        <WorldIconButton active={openPanel === 'creatures'} onClick={() => setOpenPanel((current) => (current === 'creatures' ? null : 'creatures'))} title="הגורים שלי">
          <PawPrint className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
        <WorldIconButton active={openPanel === 'food'} onClick={() => setOpenPanel((current) => (current === 'food' ? null : 'food'))} title="אוכל ושתייה">
          <Milk className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
        <WorldIconButton active={openPanel === 'style'} onClick={() => setOpenPanel((current) => (current === 'style' ? null : 'style'))} title="בגדים">
          <Shirt className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
      </div>

      {openPanel === 'food' && (
        <div className="absolute bottom-4 left-1/2 z-50 flex w-[min(92vw,720px)] -translate-x-1/2 items-center gap-3 rounded-[34px] border border-white/85 bg-white/88 px-4 py-4 shadow-[0_24px_70px_rgba(84,60,126,0.16)] backdrop-blur-xl">
          <button
            className={`flex h-14 w-14 items-center justify-center rounded-full ${foodMode === 'feed' ? 'bg-[#fff1b6]' : 'bg-slate-100'}`}
            onClick={() => setFoodMode('feed')}
            type="button"
          >
            <Milk className="h-6 w-6 text-slate-700" />
          </button>
          <button
            className={`flex h-14 w-14 items-center justify-center rounded-full ${foodMode === 'drink' ? 'bg-[#dff6ff]' : 'bg-slate-100'}`}
            onClick={() => setFoodMode('drink')}
            type="button"
          >
            <Droplets className="h-6 w-6 text-slate-700" />
          </button>

          <div className="flex flex-1 items-center justify-center gap-3 overflow-x-auto">
            {foodItems[foodMode].map((item) => (
              <button
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-white text-3xl shadow-sm transition hover:scale-105"
                key={item.id}
                onPointerDown={(event) => handleStartDragging(event, item)}
                type="button"
              >
                {item.emoji}
              </button>
            ))}
          </div>

          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"
            onClick={() => setOpenPanel(null)}
            type="button"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>
      )}

      {openPanel === 'style' && (
        <div className="absolute bottom-4 left-1/2 z-50 flex w-[min(92vw,680px)] -translate-x-1/2 items-center gap-3 rounded-[34px] border border-white/85 bg-white/88 px-4 py-4 shadow-[0_24px_70px_rgba(84,60,126,0.16)] backdrop-blur-xl">
          <div className="flex flex-1 items-center justify-center gap-3 overflow-x-auto">
            {wearableItems.length ? (
              wearableItems.map((item) => {
                const isEquipped = selectedOwnedCreature?.equippedItems.includes(item.id) ?? false

                return (
                  <button
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] text-2xl shadow-sm transition hover:scale-105 ${
                      isEquipped ? 'bg-[#fff1fb] ring-2 ring-[#f472b6]' : 'bg-white'
                    }`}
                    key={item.id}
                    onClick={() => handleWearableItem(item.id)}
                    type="button"
                  >
                    {item.icon}
                  </button>
                )
              })
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-100 text-slate-400">
                <Shirt className="h-7 w-7" />
              </div>
            )}
          </div>

          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"
            onClick={() => setOpenPanel(null)}
            type="button"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>
      )}

      {openPanel === 'creatures' && (
        <div className="absolute bottom-24 left-4 top-20 z-50 flex w-[124px] flex-col gap-3 rounded-[34px] border border-white/85 bg-white/88 p-3 shadow-[0_24px_70px_rgba(84,60,126,0.16)] backdrop-blur-xl">
          <button
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"
            onClick={() => setOpenPanel(null)}
            type="button"
          >
            <X className="h-4 w-4 text-slate-700" />
          </button>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {ownedCreatures.map((ownedCreature) => {
              const creature = getCreatureById(ownedCreature.creatureId)

              if (!creature) {
                return null
              }

              const hatched = isCreatureHatched(creature, ownedCreature, now)
              const stage = hatched ? getCurrentCreatureStage(creature, ownedCreature, now) : null
              const selected = resolvedSelectedCreatureId === ownedCreature.creatureId

              return (
                <div
                  className={`rounded-[28px] border p-2 ${selected ? 'border-[#f472b6] bg-[#fff7fd]' : 'border-transparent bg-white/72'}`}
                  key={ownedCreature.creatureId}
                >
                  <button
                    className="relative flex w-full items-center justify-center"
                    onClick={() => setSelectedCreatureId(ownedCreature.creatureId)}
                    type="button"
                  >
                    <img
                      alt={creature.name}
                      className="h-16 w-16 object-contain"
                      src={hatched ? stage?.image ?? creature.cardImage : creature.eggImage}
                    />
                    <span
                      className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full ${
                        ownedCreature.placedInHome ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {ownedCreature.placedInHome ? <Check className="h-3.5 w-3.5" /> : <PawPrint className="h-3.5 w-3.5" />}
                    </span>
                  </button>

                  <button
                    className={`mt-2 flex h-10 w-full items-center justify-center rounded-full ${
                      ownedCreature.placedInHome ? 'bg-slate-100 text-slate-500' : 'bg-[#fff1fb] text-[#d946ef]'
                    }`}
                    onClick={() => handleCreaturePlacement(ownedCreature.creatureId)}
                    type="button"
                  >
                    {ownedCreature.placedInHome ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </button>

                  {!hatched && (
                    <div className="mt-2 rounded-full bg-slate-100 px-2 py-1 text-center text-[10px] font-bold text-slate-600">
                      {formatCountdown(
                        Math.max(
                          0,
                          (new Date(ownedCreature.purchasedAt).getTime() + creature.hatchDurationMinutes * 60 * 1000) - now,
                        ),
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {homeCreatures.length ? (
        homeCreatures.map((ownedCreature) => {
          const creature = getCreatureById(ownedCreature.creatureId)

          if (!creature) {
            return null
          }

          const sceneCreature =
            sceneCreatures.find((entry) => entry.creatureId === ownedCreature.creatureId) ??
            createSceneCreature(ownedCreature.creatureId)
          const hatched = isCreatureHatched(creature, ownedCreature, now)
          const stage = hatched ? getCurrentCreatureStage(creature, ownedCreature, now) : null
          const needs = hatched ? getCreatureNeedState(creature, ownedCreature, now) : null
          const pulse = careBurst?.creatureId === ownedCreature.creatureId ? careBurst.action : null
          const reaction = reactionBubble?.creatureId === ownedCreature.creatureId ? reactionBubble.emoji : null
          const heartProgress = heartProgressByCreatureId[ownedCreature.creatureId] ?? 0
          const feedProgress = feedProgressByCreatureId[ownedCreature.creatureId] ?? 0
          const isSelected = resolvedSelectedCreatureId === ownedCreature.creatureId
          const bob = Math.sin((sceneCreature.phase / 24) * Math.PI * 2) * (sceneCreature.pauseTicks ? 2 : 5)
          const NeedIcon = needs?.primaryNeed ? careIcons[needs.primaryNeed] : null
          const showHeartMeter = hatched && (needs?.primaryNeed === 'pet' || heartProgress > 0)
          const showFeedMeter = hatched && (needs?.primaryNeed === 'feed' || feedProgress > 0)
          const showNeedBubble = hatched && needs?.primaryNeed && needs.primaryNeed !== 'pet' && needs.primaryNeed !== 'feed' && NeedIcon
          const showStarReward = starRewardCreatureId === ownedCreature.creatureId

          return (
            <div
              className="absolute z-20 touch-none transition"
              data-drop-creature-id={ownedCreature.creatureId}
              key={ownedCreature.creatureId}
              style={{
                left: `${sceneCreature.x}%`,
                top: `${sceneCreature.y}%`,
                transform: `translate(-50%, -50%) scaleX(${hatched ? sceneCreature.directionX : 1})`,
              }}
            >
              <div className="relative h-[212px] w-[176px]">
                <button
                  aria-label={creature.name}
                  className="absolute inset-0 z-10 rounded-[40px] bg-transparent"
                  onPointerDown={(event) => handleStartDraggingCreature(event, ownedCreature.creatureId)}
                  type="button"
                />

                {showHeartMeter && (
                  <button
                    className="absolute left-1/2 top-0 z-30 -translate-x-1/2"
                    onClick={(event) => {
                      event.stopPropagation()
                      handlePetCreature(ownedCreature.creatureId)
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    type="button"
                  >
                    <div
                      className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,236,242,0.94))] shadow-[0_18px_40px_rgba(56,37,87,0.14)] ${
                        needs?.primaryNeed === 'pet' || pulse === 'pet' ? 'ring-4 ring-[#fecdd3]/85' : ''
                      }`}
                    >
                      {(needs?.primaryNeed === 'pet' || pulse === 'pet') && (
                        <div className="absolute inset-0 rounded-full border-4 border-[#fda4af]/70 animate-ping" />
                      )}
                      <div
                        className="absolute inset-0 bg-[linear-gradient(180deg,#fb7185_0%,#ec4899_100%)] transition-all duration-500"
                        style={{ clipPath: getFillClipPath(heartProgress) }}
                      />
                      <Heart
                        className={`relative h-7 w-7 transition ${
                          heartProgress > 0.04 ? 'fill-current text-white' : 'text-[#ec4899]'
                        }`}
                      />
                    </div>
                  </button>
                )}

                {showFeedMeter && (
                  <button
                    className="absolute left-1/2 top-0 z-30 -translate-x-1/2"
                    onClick={(event) => {
                      event.stopPropagation()
                      setFoodMode('feed')
                      setOpenPanel('food')
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    type="button"
                  >
                    <div
                      className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,220,0.94))] shadow-[0_18px_40px_rgba(56,37,87,0.14)] ${
                        needs?.primaryNeed === 'feed' || pulse === 'feed' ? 'ring-4 ring-[#fde68a]/85' : ''
                      }`}
                    >
                      {(needs?.primaryNeed === 'feed' || pulse === 'feed') && (
                        <div className="absolute inset-0 rounded-full border-4 border-[#fde68a]/75 animate-ping" />
                      )}
                      <div
                        className="absolute inset-0 bg-[linear-gradient(180deg,#fde68a_0%,#f59e0b_100%)] transition-all duration-700"
                        style={{ clipPath: getFillClipPath(feedProgress) }}
                      />
                      <Milk className={`relative h-7 w-7 transition ${feedProgress > 0.04 ? 'text-white' : 'text-[#d97706]'}`} />
                    </div>
                  </button>
                )}

              {showNeedBubble && (
                <>
                  <button
                    className={`absolute right-3 top-6 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-[0_18px_40px_rgba(56,37,87,0.14)] transition ${
                      careBubbleClasses[needs.primaryNeed]
                    }`}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleNeedBubble(ownedCreature.creatureId, needs.primaryNeed!)
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    type="button"
                  >
                    <NeedIcon className="h-5 w-5" />
                  </button>
                </>
              )}

              <div
                className="pointer-events-none absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center transition"
                style={{
                  transform: `translateY(${bob}px) scale(${pulse ? 1.08 : isSelected ? 1.04 : 1})`,
                }}
              >
                <div
                  className={`absolute inset-x-4 bottom-2 h-6 rounded-full blur-md ${
                    pulse === 'pet'
                      ? 'bg-[#fecdd3]'
                      : pulse === 'feed'
                        ? 'bg-[#bfdbfe]'
                        : pulse === 'play'
                          ? 'bg-[#ddd6fe]'
                          : pulse === 'rest'
                            ? 'bg-[#a7f3d0]'
                            : isSelected
                              ? 'bg-[#ffb6dc]/65'
                              : 'bg-[#c9edff]/65'
                  }`}
                />
                {reaction && (
                  <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 text-3xl">
                    {reaction}
                  </div>
                )}
                {showStarReward && (
                  <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
                    ⭐
                  </div>
                )}
                <img
                  alt={creature.name}
                  className={hatched ? 'h-32 w-32 object-contain' : 'h-[104px] w-[104px] object-contain'}
                  src={hatched ? stage?.image ?? creature.cardImage : creature.eggImage}
                />
                {hatched &&
                  ownedCreature.equippedItems.slice(0, 4).map((itemId, index) => (
                    <span
                      className="absolute rounded-full bg-white/92 px-2 py-1 text-xs font-bold text-slate-700 shadow-sm"
                      key={itemId}
                      style={{
                        ...equippedItemPositions[index],
                        transform: 'scaleX(-1)',
                      }}
                    >
                      {getShopItemById(itemId)?.icon ?? '✨'}
                    </span>
                  ))}
              </div>
              </div>
            </div>
          )
        })
      ) : (
        <button
          className="absolute left-1/2 top-1/2 z-20 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/85 bg-white/86 shadow-[0_24px_70px_rgba(84,60,126,0.16)] backdrop-blur"
          onClick={() => navigate('/shop')}
          type="button"
        >
          <PawPrint className="h-10 w-10 text-slate-400" />
        </button>
      )}

      {draggedTrayItem && (
        <div
          className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-white/96 px-4 py-3 text-4xl shadow-[0_24px_60px_rgba(84,60,126,0.2)]"
          style={{ left: draggedTrayItem.x, top: draggedTrayItem.y }}
        >
          {draggedTrayItem.emoji}
        </div>
      )}
    </div>
  )
}
