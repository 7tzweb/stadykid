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
  ChevronLeft,
  ChevronRight,
  Coins,
  Droplets,
  Gamepad2,
  Heart,
  House,
  Lock,
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
import {
  getCreatureSpecialRequestById,
  getInitialSpecialRequestDelayMs,
  getNextSpecialRequestDelayMs,
  pickRandomCreatureSpecialRequest,
  specialRequestRewardEvery,
  type CreatureSpecialRequestInteraction,
  type CreatureSpecialRequestMotion,
} from '@/game/content/creature-special-requests'
import { getShopItemById } from '@/game/content/catalog'
import { getHomeWorldById, homeWorldCatalog } from '@/game/content/home-worlds'
import { useGame } from '@/hooks/useGame'
import type { CreatureCareAction } from '@/types/models'

type HomePanel = 'creatures' | 'food' | 'style' | 'props' | 'rooms' | null
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
  jumpTicksRemaining: number
  jumpDurationTicks: number
  jumpCooldownTicks: number
}

interface DragTrayItem {
  kind: 'food' | 'prop'
  id: string
  emoji?: string
  image?: string
  itemName?: string
  x: number
  y: number
}

type CreatureVisualAction = CreatureCareAction | CreatureSpecialRequestMotion

interface CareBurstState {
  creatureId: string
  action: CreatureVisualAction
}

interface CreatureReactionState {
  creatureId: string
  emoji: string
}

interface ActiveSpecialRequestState {
  requestId: string | null
  progress: number
  nextRequestAt: number
  previousRequestId: string | null
}

interface CreatureInteractionOffset {
  x: number
  y: number
}

interface SpecialRequestGestureSession {
  creatureId: string
  requestId: string
  interaction: Exclude<CreatureSpecialRequestInteraction, 'tap'>
  startX: number
  startY: number
  lastX: number
  lastY: number
  maxLift: number
  maxDrop: number
  totalHorizontalTravel: number
  totalVerticalTravel: number
  directionChanges: number
  lastHorizontalDirection: -1 | 0 | 1
  verticalDirectionChanges: number
  lastVerticalDirection: -1 | 0 | 1
  accumulatedRotation: number
  lastAngle: number | null
  holdReady: boolean
  holdTimerId: number | null
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

const maxCreaturesInRoom = 4

function getCareBurstDurationMs(action: CreatureVisualAction) {
  if (action === 'rest') {
    return 1700
  }

  if (action === 'play') {
    return 1050
  }

  if (action === 'pet') {
    return 900
  }

  if (action === 'cheer') {
    return 980
  }

  if (action === 'curious') {
    return 920
  }

  if (action === 'stretch') {
    return 1150
  }

  if (action === 'soar') {
    return 1500
  }

  if (action === 'snuggle') {
    return 1050
  }

  if (action === 'sway') {
    return 1020
  }

  if (action === 'twirl') {
    return 980
  }

  if (action === 'zoom') {
    return 1160
  }

  if (action === 'boing') {
    return 980
  }

  if (action === 'doze') {
    return 1950
  }

  if (action === 'bow') {
    return 1180
  }

  if (action === 'sniffle') {
    return 1200
  }

  if (action === 'dig') {
    return 1120
  }

  if (action === 'shake') {
    return 980
  }

  if (action === 'sprint') {
    return 1220
  }

  if (action === 'nest') {
    return 1650
  }

  return 850
}

function getCareReactionEmoji(action: CreatureCareAction) {
  if (action === 'pet') {
    return '💗'
  }

  if (action === 'feed') {
    return '😋'
  }

  if (action === 'play') {
    return '🎾'
  }

  return '💤'
}

function getCreatureAnimationClass(pulse: CreatureVisualAction | null, isJumping: boolean) {
  if (pulse === 'pet') {
    return 'puppy-animate puppy-animate-pet'
  }

  if (pulse === 'feed') {
    return 'puppy-animate puppy-animate-feed'
  }

  if (pulse === 'play') {
    return 'puppy-animate puppy-animate-play'
  }

  if (pulse === 'rest') {
    return 'puppy-animate puppy-animate-rest'
  }

  if (pulse === 'cheer') {
    return 'puppy-animate puppy-animate-cheer'
  }

  if (pulse === 'curious') {
    return 'puppy-animate puppy-animate-curious'
  }

  if (pulse === 'stretch') {
    return 'puppy-animate puppy-animate-stretch'
  }

  if (pulse === 'soar') {
    return 'puppy-animate puppy-animate-soar'
  }

  if (pulse === 'snuggle') {
    return 'puppy-animate puppy-animate-snuggle'
  }

  if (pulse === 'sway') {
    return 'puppy-animate puppy-animate-sway'
  }

  if (pulse === 'twirl') {
    return 'puppy-animate puppy-animate-twirl'
  }

  if (pulse === 'zoom') {
    return 'puppy-animate puppy-animate-zoom'
  }

  if (pulse === 'boing') {
    return 'puppy-animate puppy-animate-boing'
  }

  if (pulse === 'doze') {
    return 'puppy-animate puppy-animate-doze'
  }

  if (pulse === 'bow') {
    return 'puppy-animate puppy-animate-bow'
  }

  if (pulse === 'sniffle') {
    return 'puppy-animate puppy-animate-sniffle'
  }

  if (pulse === 'dig') {
    return 'puppy-animate puppy-animate-dig'
  }

  if (pulse === 'shake') {
    return 'puppy-animate puppy-animate-shake'
  }

  if (pulse === 'sprint') {
    return 'puppy-animate puppy-animate-sprint'
  }

  if (pulse === 'nest') {
    return 'puppy-animate puppy-animate-nest'
  }

  if (isJumping) {
    return 'puppy-animate puppy-animate-hop'
  }

  return 'puppy-animate'
}

function hashCreatureId(input: string) {
  return input.split('').reduce((total, character) => total + character.charCodeAt(0), 0)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeAngleDelta(delta: number) {
  let normalizedDelta = delta

  while (normalizedDelta > Math.PI) {
    normalizedDelta -= Math.PI * 2
  }

  while (normalizedDelta < -Math.PI) {
    normalizedDelta += Math.PI * 2
  }

  return normalizedDelta
}

function getSpecialRequestInteraction(requestId: string | null) {
  const request = requestId ? getCreatureSpecialRequestById(requestId) : null
  return request?.interaction ?? 'tap'
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
    jumpTicksRemaining: 0,
    jumpDurationTicks: 5,
    jumpCooldownTicks: 10 + (hash % 8),
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
    completeSpecialRequest,
    currentChildProfile,
    currentHomeWorldId,
    inventory,
    ownedCreatures,
    placeProp,
    placedProps,
    setCurrentHomeWorld,
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
  const [specialRequestByCreatureId, setSpecialRequestByCreatureId] = useState<Record<string, ActiveSpecialRequestState>>({})
  const [interactionOffsetByCreatureId, setInteractionOffsetByCreatureId] = useState<Record<string, CreatureInteractionOffset>>({})
  const [starRewardCreatureId, setStarRewardCreatureId] = useState<string | null>(null)
  const [placementMessage, setPlacementMessage] = useState<string | null>(null)
  const [isHomeWorldTransitioning, setIsHomeWorldTransitioning] = useState(false)
  const announcedHatchRef = useRef(new Set<string>())
  const careBurstRef = useRef<CareBurstState | null>(null)
  const heartProgressRef = useRef<Record<string, number>>({})
  const feedProgressRef = useRef<Record<string, number>>({})
  const specialRequestRef = useRef<Record<string, ActiveSpecialRequestState>>({})
  const specialRequestGestureRef = useRef<SpecialRequestGestureSession | null>(null)
  const lastPropInteractionAtRef = useRef<Record<string, number>>({})
  const sceneRef = useRef<HTMLDivElement | null>(null)

  const inventoryItems = inventory
    .map((itemId) => getShopItemById(itemId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const wearableItems = inventoryItems.filter((item) => item.category === 'Clothes' || item.category === 'Accessories')
  const propItems = inventoryItems.filter((item) => item.category === 'Props')
  const completedLevelCount = currentChildProfile?.completedLevelIds.length ?? 0
  const unlockedHomeWorlds = homeWorldCatalog.filter(
    (homeWorld) => completedLevelCount >= homeWorld.requiredCompletedLevels,
  )
  const fallbackHomeWorldId =
    unlockedHomeWorlds[unlockedHomeWorlds.length - 1]?.id ?? homeWorldCatalog[0]?.id ?? 'playroom-1'
  const resolvedHomeWorldId = unlockedHomeWorlds.some((homeWorld) => homeWorld.id === currentHomeWorldId)
    ? currentHomeWorldId
    : fallbackHomeWorldId
  const currentHomeWorld = getHomeWorldById(resolvedHomeWorldId) ?? homeWorldCatalog[0]
  const currentHomeWorldIndex = unlockedHomeWorlds.findIndex((homeWorld) => homeWorld.id === resolvedHomeWorldId)
  const previousHomeWorld = currentHomeWorldIndex > 0 ? unlockedHomeWorlds[currentHomeWorldIndex - 1] : null
  const nextHomeWorld =
    currentHomeWorldIndex >= 0 && currentHomeWorldIndex < unlockedHomeWorlds.length - 1
      ? unlockedHomeWorlds[currentHomeWorldIndex + 1]
      : null
  const homeCreatures = ownedCreatures.filter((creature) => creature.placedHomeWorldId === resolvedHomeWorldId)
  const placedRoomProps = placedProps.filter((placedProp) => placedProp.homeWorldId === resolvedHomeWorldId)
  const placedPropByItemId = new Map(placedProps.map((placedProp) => [placedProp.itemId, placedProp] as const))

  const resolvedSelectedCreatureId = ownedCreatures.some((creature) => creature.creatureId === selectedCreatureId)
    ? selectedCreatureId
    : ownedCreatures[0]?.creatureId ?? null

  const selectedOwnedCreature =
    getOwnedCreatureById(resolvedSelectedCreatureId ?? '', ownedCreatures) ?? ownedCreatures[0] ?? null
  const selectedCreature = selectedOwnedCreature ? getCreatureById(selectedOwnedCreature.creatureId) ?? null : null
  const selectedIsHatched =
    selectedCreature && selectedOwnedCreature ? isCreatureHatched(selectedCreature, selectedOwnedCreature, now) : false
  const selectedSpecialRequestState = selectedOwnedCreature
    ? specialRequestByCreatureId[selectedOwnedCreature.creatureId] ?? null
    : null
  const selectedSpecialRequest =
    selectedSpecialRequestState?.requestId ? getCreatureSpecialRequestById(selectedSpecialRequestState.requestId) ?? null : null
  const selectedNeeds =
    selectedCreature && selectedOwnedCreature && selectedIsHatched
      ? getCreatureNeedState(selectedCreature, selectedOwnedCreature, now)
      : null
  const fallbackSpecialRequestEntry = homeCreatures.find((ownedCreature) => {
    const creature = getCreatureById(ownedCreature.creatureId)

    if (!creature || !isCreatureHatched(creature, ownedCreature, now)) {
      return false
    }

    const requestState = specialRequestByCreatureId[ownedCreature.creatureId]

    if (!requestState?.requestId) {
      return false
    }

    return !getCreatureNeedState(creature, ownedCreature, now).primaryNeed
  })
  const focusedSpecialRequestCreatureId =
    selectedSpecialRequest && !selectedNeeds?.primaryNeed
      ? selectedOwnedCreature?.creatureId ?? null
      : fallbackSpecialRequestEntry?.creatureId ?? null
  const focusedSpecialRequestState =
    focusedSpecialRequestCreatureId ? specialRequestByCreatureId[focusedSpecialRequestCreatureId] ?? null : null
  const focusedSpecialRequest =
    focusedSpecialRequestState?.requestId
      ? getCreatureSpecialRequestById(focusedSpecialRequestState.requestId)
      : null

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!careBurst) {
      return
    }

    careBurstRef.current = careBurst
    const timer = window.setTimeout(() => setCareBurst(null), getCareBurstDurationMs(careBurst.action))

    return () => window.clearTimeout(timer)
  }, [careBurst])

  useEffect(() => {
    if (!careBurst) {
      careBurstRef.current = null
    }
  }, [careBurst])

  useEffect(() => {
    if (!isHomeWorldTransitioning) {
      return
    }

    const timer = window.setTimeout(() => setIsHomeWorldTransitioning(false), 340)

    return () => window.clearTimeout(timer)
  }, [isHomeWorldTransitioning])

  useEffect(() => {
    if (resolvedHomeWorldId === currentHomeWorldId) {
      return
    }

    setCurrentHomeWorld(resolvedHomeWorldId)
  }, [currentHomeWorldId, resolvedHomeWorldId, setCurrentHomeWorld])

  useEffect(() => {
    if (!starRewardCreatureId) {
      return
    }

    const timer = window.setTimeout(() => setStarRewardCreatureId(null), 1100)

    return () => window.clearTimeout(timer)
  }, [starRewardCreatureId])

  useEffect(() => {
    if (!placementMessage) {
      return
    }

    const timer = window.setTimeout(() => setPlacementMessage(null), 1800)

    return () => window.clearTimeout(timer)
  }, [placementMessage])

  useEffect(() => {
    if (!reactionBubble) {
      return
    }

    const timer = window.setTimeout(() => setReactionBubble(null), 920)

    return () => window.clearTimeout(timer)
  }, [reactionBubble])

  useEffect(() => {
    specialRequestRef.current = specialRequestByCreatureId
  }, [specialRequestByCreatureId])

  useEffect(() => {
    const activeCreatureIds = ownedCreatures
      .filter((creature) => creature.placedHomeWorldId === resolvedHomeWorldId)
      .map((creature) => creature.creatureId)

    const timer = window.setTimeout(() => {
      setSceneCreatures((current) => {
        const byId = new globalThis.Map(current.map((entry) => [entry.creatureId, entry] as const))

        return activeCreatureIds.map((creatureId) => byId.get(creatureId) ?? createSceneCreature(creatureId))
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [ownedCreatures, resolvedHomeWorldId])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneCreatures((current) =>
        current.map((entry) => {
          const ownedCreature = getOwnedCreatureById(entry.creatureId, ownedCreatures)
          const creature = getCreatureById(entry.creatureId)
          const hatched = creature && ownedCreature ? isCreatureHatched(creature, ownedCreature, Date.now()) : false
          const nextPhase = (entry.phase + 1) % 24
          const nextJumpTicksRemaining = Math.max(0, entry.jumpTicksRemaining - 1)
          const nextJumpCooldownTicks = Math.max(0, entry.jumpCooldownTicks - 1)

          if (!hatched) {
            return {
              ...entry,
              phase: nextPhase,
              jumpTicksRemaining: nextJumpTicksRemaining,
              jumpCooldownTicks: nextJumpCooldownTicks,
            }
          }

          if (draggedCreatureId === entry.creatureId) {
            return {
              ...entry,
              phase: nextPhase,
              jumpTicksRemaining: nextJumpTicksRemaining,
              jumpCooldownTicks: nextJumpCooldownTicks,
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
              jumpTicksRemaining: nextJumpTicksRemaining,
              jumpCooldownTicks: nextJumpCooldownTicks,
            }
          }

          const nextX = entry.x + entry.directionX * entry.speedX
          const nextY = entry.y + entry.directionY * entry.speedY
          const hitEdgeX = nextX < 8 || nextX > 92
          const hitEdgeY = nextY < 18 || nextY > 78
          const nextWalkTicks = entry.walkTicks - 1
          const jumpInProgress = nextJumpTicksRemaining > 0
          const shouldPause = !jumpInProgress && (nextWalkTicks <= 0 || Math.random() < 0.07)
          const shouldStartJump =
            !jumpInProgress &&
            nextJumpCooldownTicks === 0 &&
            !hitEdgeX &&
            !hitEdgeY &&
            !shouldPause &&
            Math.random() < 0.18
          const jumpDurationTicks = shouldStartJump ? 5 + Math.floor(Math.random() * 2) : entry.jumpDurationTicks

          return {
            ...entry,
            x: clamp(nextX, 8, 92),
            y: clamp(nextY, 18, 78),
            directionX: hitEdgeX ? (nextX < 8 ? 1 : -1) : entry.directionX,
            directionY: hitEdgeY ? (nextY < 18 ? 1 : -1) : entry.directionY,
            pauseTicks: hitEdgeX || hitEdgeY || shouldPause ? 5 + Math.floor(Math.random() * 7) : 0,
            walkTicks: hitEdgeX || hitEdgeY || shouldPause ? 12 + Math.floor(Math.random() * 8) : nextWalkTicks,
            phase: nextPhase,
            jumpTicksRemaining: shouldStartJump ? jumpDurationTicks : nextJumpTicksRemaining,
            jumpDurationTicks,
            jumpCooldownTicks: shouldStartJump ? 12 + Math.floor(Math.random() * 10) : nextJumpCooldownTicks,
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

  useEffect(() => {
    const ambientActions: CreatureSpecialRequestMotion[] = ['curious', 'stretch', 'snuggle', 'cheer', 'shake']
    const timer = window.setInterval(() => {
      if (careBurstRef.current || draggedCreatureId) {
        return
      }

      const candidates = homeCreatures.filter((ownedCreature) => {
        const creature = getCreatureById(ownedCreature.creatureId)

        if (!creature || !isCreatureHatched(creature, ownedCreature, Date.now())) {
          return false
        }

        if (specialRequestRef.current[ownedCreature.creatureId]?.requestId) {
          return false
        }

        return !getCreatureNeedState(creature, ownedCreature, Date.now()).primaryNeed
      })

      if (candidates.length === 0 || Math.random() < 0.56) {
        return
      }

      const ownedCreature = candidates[Math.floor(Math.random() * candidates.length)]
      const action = ambientActions[Math.floor(Math.random() * ambientActions.length)] ?? 'curious'

      setCareBurst({ creatureId: ownedCreature.creatureId, action })
    }, 2300)

    return () => window.clearInterval(timer)
  }, [draggedCreatureId, homeCreatures])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (careBurstRef.current || draggedCreatureId || !placedRoomProps.length) {
        return
      }

      const nowTs = Date.now()
      const candidates = homeCreatures.flatMap((ownedCreature) => {
        const creature = getCreatureById(ownedCreature.creatureId)
        const sceneCreature = sceneCreatures.find((entry) => entry.creatureId === ownedCreature.creatureId)

        if (!creature || !sceneCreature || !isCreatureHatched(creature, ownedCreature, nowTs)) {
          return []
        }

        const needs = getCreatureNeedState(creature, ownedCreature, nowTs)

        if (needs.primaryNeed) {
          return []
        }

        const lastPropInteractionAt = lastPropInteractionAtRef.current[ownedCreature.creatureId] ?? 0

        if (nowTs - lastPropInteractionAt < 5200) {
          return []
        }

        const nearbyProp = placedRoomProps.find((placedProp) => {
          const deltaX = Math.abs(placedProp.x - sceneCreature.x)
          const deltaY = Math.abs(placedProp.y - sceneCreature.y)
          return deltaX <= 8 && deltaY <= 10
        })

        if (!nearbyProp) {
          return []
        }

        const item = getShopItemById(nearbyProp.itemId)

        if (!item || item.category !== 'Props') {
          return []
        }

        const resolvedRequest = resolveActiveSpecialRequest(ownedCreature.creatureId)

        if (resolvedRequest?.request.requiredItemId && resolvedRequest.request.requiredItemId !== item.id) {
          return []
        }

        return [{ ownedCreature, item, resolvedRequest }]
      })

      if (!candidates.length || Math.random() < 0.38) {
        return
      }

      const pickedInteraction = candidates[Math.floor(Math.random() * candidates.length)]

      if (!pickedInteraction) {
        return
      }

      lastPropInteractionAtRef.current[pickedInteraction.ownedCreature.creatureId] = nowTs
      setSelectedCreatureId(pickedInteraction.ownedCreature.creatureId)

      if (
        pickedInteraction.resolvedRequest &&
        pickedInteraction.resolvedRequest.request.requiredItemId === pickedInteraction.item.id
      ) {
        void advanceSpecialRequest(
          pickedInteraction.ownedCreature.creatureId,
          pickedInteraction.resolvedRequest.specialRequestState,
          pickedInteraction.resolvedRequest.request.id,
          pickedInteraction.resolvedRequest.request.animation,
          pickedInteraction.resolvedRequest.ownedCreature.specialRequestCount,
          pickedInteraction.resolvedRequest.request.progressEmojis,
          pickedInteraction.resolvedRequest.request.completionEmoji,
          pickedInteraction.resolvedRequest.request.tapsRequired,
        )
        return
      }

      setCareBurst({
        creatureId: pickedInteraction.ownedCreature.creatureId,
        action: resolvePropAnimation(pickedInteraction.item.id),
      })
      showReaction(pickedInteraction.ownedCreature.creatureId, pickedInteraction.item.icon)
    }, 1450)

    return () => window.clearInterval(timer)
  }, [draggedCreatureId, homeCreatures, placedRoomProps, sceneCreatures])

  useEffect(() => {
    const availablePropIdsByHomeWorld = placedProps.reduce<Record<string, string[]>>((mapping, placedProp) => {
      if (!mapping[placedProp.homeWorldId]) {
        mapping[placedProp.homeWorldId] = []
      }

      mapping[placedProp.homeWorldId]?.push(placedProp.itemId)
      return mapping
    }, {})

    setSpecialRequestByCreatureId((current) => {
      const nextState: Record<string, ActiveSpecialRequestState> = {}
      let changed = false

      ownedCreatures
        .filter((creature) => creature.placedInHome)
        .forEach((ownedCreature) => {
          const creature = getCreatureById(ownedCreature.creatureId)
          const hatched = creature ? isCreatureHatched(creature, ownedCreature, now) : false
          const currentRequestState = current[ownedCreature.creatureId]

          if (!creature || !hatched) {
            if (currentRequestState) {
              nextState[ownedCreature.creatureId] = currentRequestState
            }
            return
          }

          const baseState =
            currentRequestState ??
            {
              requestId: null,
              progress: 0,
              nextRequestAt: now + getInitialSpecialRequestDelayMs(),
              previousRequestId: null,
            }

          let resolvedState = baseState
          const availablePropItemIds = availablePropIdsByHomeWorld[ownedCreature.placedHomeWorldId ?? ''] ?? []

          if (!currentRequestState) {
            changed = true
          }

          if (resolvedState.requestId) {
            const activeRequest = getCreatureSpecialRequestById(resolvedState.requestId)

            if (activeRequest?.requiredItemId && !availablePropItemIds.includes(activeRequest.requiredItemId)) {
              resolvedState = {
                requestId: null,
                progress: 0,
                nextRequestAt: now + Math.round(getInitialSpecialRequestDelayMs() * 0.45),
                previousRequestId: activeRequest.id,
              }
              changed = true
            }
          }

          if (!resolvedState.requestId && now >= resolvedState.nextRequestAt) {
            const request = pickRandomCreatureSpecialRequest(resolvedState.previousRequestId, availablePropItemIds)

            resolvedState = {
              ...resolvedState,
              requestId: request.id,
              progress: 0,
            }
            changed = true
          }

          nextState[ownedCreature.creatureId] = resolvedState
        })

      if (Object.keys(current).length !== Object.keys(nextState).length) {
        changed = true
      }

      if (!changed) {
        changed = Object.entries(nextState).some(([creatureId, requestState]) => {
          const currentRequestState = current[creatureId]

          return (
            !currentRequestState ||
            currentRequestState.requestId !== requestState.requestId ||
            currentRequestState.progress !== requestState.progress ||
            currentRequestState.nextRequestAt !== requestState.nextRequestAt ||
            currentRequestState.previousRequestId !== requestState.previousRequestId
          )
        })
      }

      if (!changed) {
        return current
      }

      return nextState
    })
  }, [now, ownedCreatures, placedProps])

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
    showReaction(creatureId, getCareReactionEmoji(action))

    if (rewardStars > 0) {
      setStarRewardCreatureId(creatureId)
    }

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

  function updateSpecialRequest(creatureId: string, nextRequestState: ActiveSpecialRequestState) {
    specialRequestRef.current = {
      ...specialRequestRef.current,
      [creatureId]: nextRequestState,
    }

    setSpecialRequestByCreatureId((current) => ({
      ...current,
      [creatureId]: nextRequestState,
    }))
  }

  function scheduleNextSpecialRequest(creatureId: string, previousRequestId: string | null, from = Date.now()) {
    updateSpecialRequest(creatureId, {
      requestId: null,
      progress: 0,
      nextRequestAt: from + getNextSpecialRequestDelayMs(),
      previousRequestId,
    })
  }

  function updateCreatureInteractionOffset(creatureId: string, offset: CreatureInteractionOffset | null) {
    setInteractionOffsetByCreatureId((current) => {
      if (!offset) {
        if (!(creatureId in current)) {
          return current
        }

        const nextState = { ...current }
        delete nextState[creatureId]
        return nextState
      }

      return {
        ...current,
        [creatureId]: offset,
      }
    })
  }

  function resolveActiveSpecialRequest(creatureId: string) {
    const specialRequestState = specialRequestRef.current[creatureId]
    const request = specialRequestState?.requestId ? getCreatureSpecialRequestById(specialRequestState.requestId) : null
    const ownedCreature = getOwnedCreatureById(creatureId, ownedCreatures)
    const creature = getCreatureById(creatureId)

    if (!specialRequestState || !request || !ownedCreature || !creature || !isCreatureHatched(creature, ownedCreature, now)) {
      return null
    }

    const needs = getCreatureNeedState(creature, ownedCreature, now)

    if (needs.primaryNeed) {
      return null
    }

    return {
      specialRequestState,
      request,
      ownedCreature,
      creature,
    }
  }

  function advanceSpecialRequest(
    creatureId: string,
    requestState: ActiveSpecialRequestState,
    requestId: string,
    animation: CreatureVisualAction,
    ownedCreatureSpecialRequestCount: number,
    progressEmojis: string[],
    completionEmoji: string,
    stepsRequired: number,
  ) {
    const nextProgress = Math.min(stepsRequired, requestState.progress + 1)

    setSelectedCreatureId(creatureId)
    setCareBurst({ creatureId, action: animation })

    if (nextProgress < stepsRequired) {
      showReaction(creatureId, progressEmojis[nextProgress - 1] ?? completionEmoji)
      updateSpecialRequest(creatureId, {
        ...requestState,
        progress: nextProgress,
      })
      return true
    }

    const rewardStars = (ownedCreatureSpecialRequestCount + 1) % specialRequestRewardEvery === 0 ? 1 : 0
    const didComplete = completeSpecialRequest(creatureId, rewardStars)

    if (!didComplete) {
      return false
    }

    showReaction(creatureId, completionEmoji)

    if (rewardStars > 0) {
      setStarRewardCreatureId(creatureId)
    }

    scheduleNextSpecialRequest(creatureId, requestId)
    return true
  }

  function handleSpecialRequestTap(creatureId: string) {
    const resolvedRequest = resolveActiveSpecialRequest(creatureId)

    if (!resolvedRequest || getSpecialRequestInteraction(resolvedRequest.request.id) !== 'tap') {
      return false
    }

    return advanceSpecialRequest(
      creatureId,
      resolvedRequest.specialRequestState,
      resolvedRequest.request.id,
      resolvedRequest.request.animation,
      resolvedRequest.ownedCreature.specialRequestCount,
      resolvedRequest.request.progressEmojis,
      resolvedRequest.request.completionEmoji,
      resolvedRequest.request.tapsRequired,
    )
  }

  function handleCreatureTap(creatureId: string) {
    if (handleSpecialRequestTap(creatureId)) {
      return
    }

    const resolvedRequest = resolveActiveSpecialRequest(creatureId)

    if (resolvedRequest && getSpecialRequestInteraction(resolvedRequest.request.id) !== 'tap') {
      setSelectedCreatureId(creatureId)
      showReaction(creatureId, resolvedRequest.request.hintEmoji ?? resolvedRequest.request.emoji)
      return
    }

    setSelectedCreatureId(creatureId)
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
    showReaction(creatureId, getCareReactionEmoji('pet'))

    const currentProgress = heartProgressRef.current[creatureId] ?? 0
    const nextProgress = Math.min(1, currentProgress + 1 / Math.max(1, creature.needs.pettingRewardClicks))

    updateHeartProgress(creatureId, nextProgress)

    if (nextProgress < 0.999) {
      return
    }

    const rewardStars = creature.needs.rewardStars.pet

    if (careForCreature(creatureId, 'pet', rewardStars) && rewardStars > 0) {
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
    showReaction(creatureId, getCareReactionEmoji('feed'))
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
    const placementResult = toggleCreaturePlacement(creatureId, resolvedHomeWorldId)

    if (placementResult === 'room-full') {
      setPlacementMessage(`אֶפְשָׁר לָשִׂים בַּחֶדֶר עַד ${maxCreaturesInRoom} בַּעֲלֵי חַיִּים בְּמַקְבִּיל`)
      return
    }

    if (placementResult === 'assigned-other-room') {
      const assignedHomeWorld = getHomeWorldById(
        ownedCreatures.find((creature) => creature.creatureId === creatureId)?.placedHomeWorldId ?? '',
      )
      setPlacementMessage(`הַגּוּר כְּבָר נִמְצָא בְּ-${assignedHomeWorld?.name ?? 'חדר אחר'}`)
      return
    }

    setPlacementMessage(placementResult === 'removed' ? 'הַגּוּר יָצָא מֵהַחֶדֶר הַזֶּה' : null)
    setSelectedCreatureId(creatureId)
  }

  function handleSelectHomeWorld(homeWorldId: string) {
    const homeWorld = getHomeWorldById(homeWorldId)

    if (!homeWorld || completedLevelCount < homeWorld.requiredCompletedLevels) {
      return
    }

    if (homeWorldId === resolvedHomeWorldId) {
      setOpenPanel(null)
      return
    }

    setIsHomeWorldTransitioning(true)
    setCurrentHomeWorld(homeWorldId)
    setOpenPanel(null)
  }

  function handleStepHomeWorld(direction: 'previous' | 'next') {
    const targetHomeWorld = direction === 'previous' ? previousHomeWorld : nextHomeWorld

    if (!targetHomeWorld) {
      return
    }

    handleSelectHomeWorld(targetHomeWorld.id)
  }

  function handleWearableItem(itemId: string) {
    if (!selectedCreature || !selectedOwnedCreature || !selectedIsHatched) {
      return
    }

    toggleCreatureItem(selectedCreature.id, itemId)
    setCareBurst({ creatureId: selectedCreature.id, action: 'play' })
  }

  function resolvePropAnimation(itemId: string): CreatureVisualAction {
    if (itemId === 'moon-pillow') {
      return 'doze'
    }

    if (itemId === 'sparkle-ball') {
      return 'sprint'
    }

    if (itemId === 'flower-sniff-mat') {
      return 'sniffle'
    }

    if (itemId === 'cloud-blanket') {
      return 'snuggle'
    }

    if (itemId === 'rainbow-tunnel') {
      return 'zoom'
    }

    if (itemId === 'butterfly-ribbon') {
      return 'play'
    }

    if (itemId === 'squeaky-duck') {
      return 'cheer'
    }

    if (itemId === 'heart-plush') {
      return 'snuggle'
    }

    if (itemId === 'dream-unicorn-playground' || itemId === 'garden-slide-park') {
      return 'zoom'
    }

    if (itemId === 'sweet-skateboard') {
      return 'sprint'
    }

    if (itemId === 'tea-party-table' || itemId === 'teddy-twin-seat') {
      return 'snuggle'
    }

    if (itemId === 'heart-surprise-booth' || itemId === 'starlight-play-console') {
      return 'cheer'
    }

    if (itemId === 'fluffy-heart-rug' || itemId === 'flower-dream-bed') {
      return 'nest'
    }

    if (itemId === 'rainbow-splash-pool' || itemId === 'rainbow-beach-ball') {
      return 'play'
    }

    if (itemId === 'golden-moon-swing') {
      return 'sway'
    }

    return 'play'
  }

  function placePropAtPointer(clientX: number, clientY: number, itemId: string) {
    const sceneBounds = sceneRef.current?.getBoundingClientRect()
    const item = getShopItemById(itemId)

    if (!sceneBounds || !item || item.category !== 'Props') {
      return false
    }

    const x = clamp(((clientX - sceneBounds.left) / sceneBounds.width) * 100, 12, 88)
    const y = clamp(((clientY - sceneBounds.top) / sceneBounds.height) * 100, 24, 84)

    placeProp({
      itemId,
      homeWorldId: resolvedHomeWorldId,
      x,
      y,
    })
    setOpenPanel(null)
    setPlacementMessage(`הוֹסַפְתָּ לַחֶדֶר אֶת ${item.name}`)
    return true
  }

  function handleStartDragging(
    event: ReactPointerEvent<HTMLButtonElement>,
    item: { id: string; emoji?: string; image?: string; itemName?: string; kind: 'food' | 'prop' },
  ) {
    event.preventDefault()
    setDraggedTrayItem({
      ...item,
      x: event.clientX,
      y: event.clientY,
    })
  }

  const resolveTrayDrop = useEffectEvent((clientX: number, clientY: number, item: DragTrayItem) => {
    if (item.kind === 'food') {
      const element = document.elementFromPoint(clientX, clientY)
      const dropTarget =
        element instanceof HTMLElement ? (element.closest('[data-drop-creature-id]') as HTMLElement | null) : null
      const creatureId = dropTarget?.dataset.dropCreatureId

      if (!creatureId) {
        return
      }

      handleFeedCreature(creatureId)
      return
    }

    placePropAtPointer(clientX, clientY, item.id)
  })

  function getGestureOffset(
    interaction: Exclude<CreatureSpecialRequestInteraction, 'tap'>,
    deltaX: number,
    deltaY: number,
  ) {
    if (interaction === 'lift') {
      return {
        x: clamp(deltaX * 0.14, -12, 12),
        y: clamp(deltaY * 0.42, -42, 20),
      }
    }

    if (interaction === 'hold') {
      return {
        x: clamp(deltaX * 0.08, -6, 6),
        y: clamp(deltaY * 0.08, -8, 8),
      }
    }

    if (interaction === 'sway') {
      return {
        x: clamp(deltaX * 0.36, -30, 30),
        y: clamp(deltaY * 0.08, -6, 6),
      }
    }

    if (interaction === 'spin') {
      return {
        x: clamp(deltaX * 0.22, -18, 18),
        y: clamp(deltaY * 0.22, -18, 18),
      }
    }

  if (interaction === 'dash') {
    return {
      x: clamp(deltaX * 0.3, -34, 34),
      y: clamp(deltaY * 0.05, -4, 4),
    }
  }

  if (interaction === 'lower') {
    return {
      x: clamp(deltaX * 0.08, -8, 8),
      y: clamp(deltaY * 0.38, -6, 34),
    }
  }

  if (interaction === 'shake') {
    return {
      x: clamp(deltaX * 0.34, -24, 24),
      y: clamp(deltaY * 0.06, -4, 6),
    }
  }

  if (interaction === 'scratch') {
    return {
      x: clamp(deltaX * 0.08, -8, 8),
      y: clamp(deltaY * 0.3, -6, 28),
    }
  }

  if (interaction === 'sniff') {
    return {
      x: clamp(deltaX * 0.16, -18, 18),
      y: clamp(deltaY * 0.16, -18, 18),
    }
  }

  return {
    x: clamp(deltaX * 0.12, -10, 10),
    y: clamp(deltaY * 0.35, -8, 30),
  }
  }

  function didSpecialGestureSucceed(session: SpecialRequestGestureSession) {
    if (session.interaction === 'lift') {
      return session.maxLift >= 76
    }

    if (session.interaction === 'hold') {
      return session.holdReady
    }

    if (session.interaction === 'sway') {
      return session.directionChanges >= 2 && session.totalHorizontalTravel >= 150
    }

    if (session.interaction === 'spin') {
      return Math.abs(session.accumulatedRotation) >= Math.PI * 1.3
    }

  if (session.interaction === 'dash') {
    return session.totalHorizontalTravel >= 160
  }

  if (session.interaction === 'lower') {
    return session.maxDrop >= 58
  }

  if (session.interaction === 'shake') {
    return session.directionChanges >= 4 && session.totalHorizontalTravel >= 120
  }

  if (session.interaction === 'scratch') {
    return session.verticalDirectionChanges >= 3 && session.totalVerticalTravel >= 132
  }

  if (session.interaction === 'sniff') {
    return (
      Math.abs(session.accumulatedRotation) >= Math.PI * 0.7 &&
      session.totalHorizontalTravel + session.totalVerticalTravel >= 78
    )
  }

  return session.maxDrop >= 72
}

  function handleStartSpecialRequestGesture(
    event: ReactPointerEvent<HTMLButtonElement>,
    creatureId: string,
    interaction: Exclude<CreatureSpecialRequestInteraction, 'tap'>,
    requestId: string,
  ) {
    event.preventDefault()
    event.stopPropagation()
    setSelectedCreatureId(creatureId)
    setDraggedCreatureId(creatureId)

    const holdTimerId =
      interaction === 'hold'
        ? window.setTimeout(() => {
            const activeSession = specialRequestGestureRef.current

            if (!activeSession || activeSession.creatureId !== creatureId || activeSession.requestId !== requestId) {
              return
            }

            specialRequestGestureRef.current = {
              ...activeSession,
              holdReady: true,
              holdTimerId: null,
            }
            showReaction(creatureId, '💞')
          }, 700)
        : null

    specialRequestGestureRef.current = {
      creatureId,
      requestId,
      interaction,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      maxLift: 0,
      maxDrop: 0,
      totalHorizontalTravel: 0,
      totalVerticalTravel: 0,
      directionChanges: 0,
      lastHorizontalDirection: 0,
      verticalDirectionChanges: 0,
      lastVerticalDirection: 0,
      accumulatedRotation: 0,
      lastAngle: null,
      holdReady: false,
      holdTimerId,
    }

    function clearGestureSession() {
      const activeSession = specialRequestGestureRef.current

      if (activeSession?.holdTimerId) {
        window.clearTimeout(activeSession.holdTimerId)
      }

      specialRequestGestureRef.current = null
      updateCreatureInteractionOffset(creatureId, null)
      setDraggedCreatureId(null)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
    }

    function handlePointerMove(moveEvent: PointerEvent) {
      const activeSession = specialRequestGestureRef.current

      if (!activeSession || activeSession.creatureId !== creatureId || activeSession.requestId !== requestId) {
        return
      }

      const deltaX = moveEvent.clientX - activeSession.startX
      const deltaY = moveEvent.clientY - activeSession.startY
      const horizontalStep = moveEvent.clientX - activeSession.lastX
      const verticalStep = moveEvent.clientY - activeSession.lastY
      const nextHorizontalDirection = horizontalStep > 3 ? 1 : horizontalStep < -3 ? -1 : 0
      const nextVerticalDirection = verticalStep > 3 ? 1 : verticalStep < -3 ? -1 : 0
      const radius = Math.hypot(deltaX, deltaY)
      const nextAngle = radius > 18 ? Math.atan2(deltaY, deltaX) : activeSession.lastAngle
      const angleDelta =
        activeSession.lastAngle !== null && nextAngle !== null
          ? normalizeAngleDelta(nextAngle - activeSession.lastAngle)
          : 0

      if (activeSession.holdTimerId && Math.hypot(deltaX, deltaY) > 18) {
        window.clearTimeout(activeSession.holdTimerId)
        activeSession.holdTimerId = null
      }

      specialRequestGestureRef.current = {
        ...activeSession,
        lastX: moveEvent.clientX,
        lastY: moveEvent.clientY,
        maxLift: Math.max(activeSession.maxLift, activeSession.startY - moveEvent.clientY),
        maxDrop: Math.max(activeSession.maxDrop, moveEvent.clientY - activeSession.startY),
        totalHorizontalTravel: activeSession.totalHorizontalTravel + Math.abs(horizontalStep),
        totalVerticalTravel: activeSession.totalVerticalTravel + Math.abs(verticalStep),
        directionChanges:
          nextHorizontalDirection !== 0 &&
          activeSession.lastHorizontalDirection !== 0 &&
          nextHorizontalDirection !== activeSession.lastHorizontalDirection
            ? activeSession.directionChanges + 1
            : activeSession.directionChanges,
        lastHorizontalDirection:
          nextHorizontalDirection !== 0 ? nextHorizontalDirection : activeSession.lastHorizontalDirection,
        verticalDirectionChanges:
          nextVerticalDirection !== 0 &&
          activeSession.lastVerticalDirection !== 0 &&
          nextVerticalDirection !== activeSession.lastVerticalDirection
            ? activeSession.verticalDirectionChanges + 1
            : activeSession.verticalDirectionChanges,
        lastVerticalDirection:
          nextVerticalDirection !== 0 ? nextVerticalDirection : activeSession.lastVerticalDirection,
        accumulatedRotation: activeSession.accumulatedRotation + angleDelta,
        lastAngle: nextAngle,
      }

      updateCreatureInteractionOffset(creatureId, getGestureOffset(interaction, deltaX, deltaY))
    }

    function handlePointerEnd() {
      const activeSession = specialRequestGestureRef.current

      clearGestureSession()

      if (!activeSession || activeSession.creatureId !== creatureId || activeSession.requestId !== requestId) {
        return
      }

      const resolvedRequest = resolveActiveSpecialRequest(creatureId)

      if (!resolvedRequest || resolvedRequest.request.id !== requestId) {
        return
      }

      if (didSpecialGestureSucceed(activeSession)) {
        advanceSpecialRequest(
          creatureId,
          resolvedRequest.specialRequestState,
          resolvedRequest.request.id,
          resolvedRequest.request.animation,
          resolvedRequest.ownedCreature.specialRequestCount,
          resolvedRequest.request.progressEmojis,
          resolvedRequest.request.completionEmoji,
          resolvedRequest.request.tapsRequired,
        )
        return
      }

      showReaction(creatureId, resolvedRequest.request.hintEmoji ?? resolvedRequest.request.emoji)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)
  }

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
    const resolvedRequest = resolveActiveSpecialRequest(creatureId)
    const requestInteraction = resolvedRequest ? getSpecialRequestInteraction(resolvedRequest.request.id) : 'tap'

    if (resolvedRequest && requestInteraction !== 'tap') {
      handleStartSpecialRequestGesture(
        event,
        creatureId,
        requestInteraction,
        resolvedRequest.request.id,
      )
      return
    }

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

      if (!moved) {
        handleCreatureTap(creatureId)
      }
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

      resolveTrayDrop(event.clientX, event.clientY, draggedTrayItem)
      setDraggedTrayItem(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [draggedTrayItem, resolveTrayDrop])

  return (
    <div
      className="relative h-[100dvh] w-screen overflow-hidden bg-[#f7f1ff]"
      ref={sceneRef}
      style={{
        backgroundImage:
          `linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04)), url(${currentHomeWorld?.backgroundImage ?? '/assets/world/playroom-bg1.png'})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-white/35 transition-opacity duration-300 ${
          isHomeWorldTransitioning ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.22)_0%,_rgba(255,255,255,0)_28%,_rgba(255,244,228,0.12)_100%)]" />

      {unlockedHomeWorlds.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 z-40 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-white/90 bg-white/86 text-slate-700 shadow-[0_20px_50px_rgba(56,37,87,0.18)] backdrop-blur transition hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!previousHomeWorld}
            onClick={() => handleStepHomeWorld('previous')}
            type="button"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            className="absolute right-4 top-1/2 z-40 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-white/90 bg-white/86 text-slate-700 shadow-[0_20px_50px_rgba(56,37,87,0.18)] backdrop-blur transition hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!nextHomeWorld}
            onClick={() => handleStepHomeWorld('next')}
            type="button"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

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
              <span>{currentHomeWorld?.name ?? 'חֶדֶר הַגּוּרִים'}</span>
              <span>•</span>
              <span>{unlockedHomeWorlds.length}/{homeWorldCatalog.length}</span>
            </div>
          </div>
        </button>
      </div>

      {focusedSpecialRequest && (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,246,240,0.94))] px-4 py-3 shadow-[0_20px_50px_rgba(56,37,87,0.16)] backdrop-blur">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-[0_12px_30px_rgba(84,60,126,0.1)] ring-2 ${focusedSpecialRequest.bubbleClass}`}
            >
              {focusedSpecialRequest.emoji}
            </div>
            <div className="text-right">
              <p className="text-[11px] font-black tracking-[0.18em] text-slate-400">מָה הַגּוּר מְבַקֵּשׁ?</p>
              <div className="mt-1 flex items-center justify-end gap-2 text-sm font-black text-slate-900">
                <span>{focusedSpecialRequest.hintEmoji ?? focusedSpecialRequest.emoji}</span>
                <span>{focusedSpecialRequest.hintLabel ?? focusedSpecialRequest.label}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <WorldIconButton onClick={() => navigate('/worlds')} title="עוֹלַם הַשְּׁאֵלוֹת">
          <MapIcon className="h-6 w-6 text-[#f26a4b]" />
        </WorldIconButton>
        <WorldIconButton onClick={() => navigate('/shop')} title="חֲנוּת">
          <ShoppingBag className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
        <WorldIconButton onClick={() => navigate('/progress')} title="הִתְקַדְּמוּת">
          <BarChart3 className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
        <WorldIconButton onClick={() => navigate('/settings')} title="הַגְדָּרוֹת">
          <Settings className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
      </div>

      <div className="absolute bottom-4 left-4 z-40 flex items-center gap-3 rounded-full border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(243,238,255,0.88))] p-2 shadow-[0_20px_50px_rgba(56,37,87,0.18)] backdrop-blur-xl">
        <WorldIconButton active={openPanel === 'rooms'} onClick={() => setOpenPanel((current) => (current === 'rooms' ? null : 'rooms'))} title="חֲדָרִים">
          <House className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
        <WorldIconButton active={openPanel === 'creatures'} onClick={() => setOpenPanel((current) => (current === 'creatures' ? null : 'creatures'))} title="הַגּוּרִים שֶׁלִּי">
          <PawPrint className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
        <WorldIconButton active={openPanel === 'food'} onClick={() => setOpenPanel((current) => (current === 'food' ? null : 'food'))} title="אוֹכֶל וּשְׁתִיָּה">
          <Milk className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
        <WorldIconButton active={openPanel === 'props'} onClick={() => setOpenPanel((current) => (current === 'props' ? null : 'props'))} title="חֲפָצִים">
          <Gamepad2 className="h-6 w-6 text-slate-700" />
        </WorldIconButton>
        <WorldIconButton active={openPanel === 'style'} onClick={() => setOpenPanel((current) => (current === 'style' ? null : 'style'))} title="בְּגָדִים">
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
                onPointerDown={(event) => handleStartDragging(event, { ...item, kind: 'food' })}
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

      {openPanel === 'props' && (
        <div className="absolute bottom-4 left-1/2 z-50 flex w-[min(92vw,760px)] -translate-x-1/2 items-center gap-3 rounded-[34px] border border-white/85 bg-white/88 px-4 py-4 shadow-[0_24px_70px_rgba(84,60,126,0.16)] backdrop-blur-xl">
          <div className="shrink-0 rounded-[22px] bg-[#fff7ed] px-4 py-3 text-right">
            <p className="text-xs font-black text-[#c2410c]">חֲפָצִים לַגּוּרִים</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">גוֹרְרִים לַחֶדֶר וּמַנִּיחִים בַּמָּקוֹם שֶׁרוֹצִים</p>
          </div>
          <div className="flex flex-1 items-center justify-center gap-3 overflow-x-auto">
            {propItems.length ? (
              propItems.map((item) => (
                <button
                  className={`flex h-20 min-w-[98px] shrink-0 flex-col items-center justify-center rounded-[24px] px-3 text-center shadow-sm transition hover:scale-105 ${
                    placedPropByItemId.get(item.id)?.homeWorldId === resolvedHomeWorldId
                      ? 'bg-[#fff1fb] ring-2 ring-[#f472b6]'
                      : 'bg-white'
                  }`}
                  key={item.id}
                  onPointerDown={(event) =>
                    handleStartDragging(event, {
                      id: item.id,
                      emoji: item.icon,
                      image: item.image,
                      itemName: item.name,
                      kind: 'prop',
                    })}
                  type="button"
                >
                  {item.image ? (
                    <img alt={item.name} className="h-10 w-14 object-contain" src={item.image} />
                  ) : (
                    <span className="text-2xl leading-none">{item.icon}</span>
                  )}
                  <span className="mt-1 line-clamp-1 text-[10px] font-bold text-slate-500">{item.name}</span>
                  {placedPropByItemId.get(item.id)?.homeWorldId === resolvedHomeWorldId && (
                    <span className="mt-1 rounded-full bg-[#fde7f5] px-2 py-0.5 text-[9px] font-black text-[#be185d]">
                      בַּחֶדֶר
                    </span>
                  )}
                </button>
              ))
            ) : (
              <button
                className="flex h-16 items-center gap-2 rounded-[22px] bg-slate-100 px-5 text-sm font-bold text-slate-500"
                onClick={() => navigate('/shop')}
                type="button"
              >
                <Gamepad2 className="h-5 w-5" />
                הולכים לחנות חפצים
              </button>
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

      {openPanel === 'rooms' && (
        <div className="absolute bottom-24 left-1/2 z-50 flex w-[min(94vw,980px)] -translate-x-1/2 flex-col gap-4 rounded-[34px] border border-white/85 bg-white/88 px-4 py-4 shadow-[0_24px_70px_rgba(84,60,126,0.16)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black text-slate-900">חֲדָרִים ועולמות בבית</p>
              <p className="text-sm font-semibold text-slate-500">
                נפתחו
                {' '}
                {unlockedHomeWorlds.length}
                {' '}
                מתוך
                {' '}
                {homeWorldCatalog.length}
                {' '}
                חֲדָרִים לפי השלבים שהושלמו.
              </p>
            </div>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100"
              onClick={() => setOpenPanel(null)}
              type="button"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>
          </div>

          <div className="soft-scroll flex gap-3 overflow-x-auto pb-1">
            {homeWorldCatalog.map((homeWorld) => {
              const isUnlocked = completedLevelCount >= homeWorld.requiredCompletedLevels
              const isActive = homeWorld.id === resolvedHomeWorldId

              return (
                <button
                  className={`min-w-[220px] overflow-hidden rounded-[28px] border text-right shadow-sm transition ${
                    isUnlocked ? 'border-white/80 bg-white hover:scale-[1.02]' : 'border-white/70 bg-slate-100/90 opacity-75'
                  } ${isActive ? 'ring-2 ring-[#f472b6]' : ''}`}
                  disabled={!isUnlocked}
                  key={homeWorld.id}
                  onClick={() => handleSelectHomeWorld(homeWorld.id)}
                  type="button"
                >
                  <div
                    className="h-28 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${homeWorld.backgroundImage})` }}
                  />
                  <div className="space-y-2 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-xl text-slate-900">{homeWorld.name}</p>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: homeWorld.accent }}
                      >
                        {isActive ? 'כָּאן עַכְשָׁיו' : isUnlocked ? 'פָּתוּחַ' : 'נָעוּל'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{homeWorld.description}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      {isUnlocked ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" />
                          מעבר מיידי לחדר
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-slate-400" />
                          נפתח אחרי
                          {' '}
                          {homeWorld.requiredCompletedLevels}
                          {' '}
                          שלבים שהושלמו
                        </>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
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
            <div className="rounded-[20px] bg-[#fff7ed] px-2 py-2 text-center text-[11px] font-bold text-[#c2410c]">
              {homeCreatures.length}/{maxCreaturesInRoom} בחדר
            </div>

            {ownedCreatures.map((ownedCreature) => {
              const creature = getCreatureById(ownedCreature.creatureId)

              if (!creature) {
                return null
              }

              const hatched = isCreatureHatched(creature, ownedCreature, now)
              const stage = hatched ? getCurrentCreatureStage(creature, ownedCreature, now) : null
              const selected = resolvedSelectedCreatureId === ownedCreature.creatureId
              const assignedHomeWorld = ownedCreature.placedHomeWorldId
                ? getHomeWorldById(ownedCreature.placedHomeWorldId)
                : null
              const isPlacedInCurrentHome = ownedCreature.placedHomeWorldId === resolvedHomeWorldId
              const isPlacedInAnotherHome =
                typeof ownedCreature.placedHomeWorldId === 'string' && ownedCreature.placedHomeWorldId !== resolvedHomeWorldId
              const placementLimitReached = homeCreatures.length >= maxCreaturesInRoom && !isPlacedInCurrentHome && !isPlacedInAnotherHome

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
                        isPlacedInCurrentHome
                          ? 'bg-emerald-100 text-emerald-700'
                          : isPlacedInAnotherHome
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isPlacedInCurrentHome ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : isPlacedInAnotherHome ? (
                        <House className="h-3.5 w-3.5" />
                      ) : (
                        <PawPrint className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </button>

                  <button
                    className={`mt-2 flex h-10 w-full items-center justify-center rounded-full ${
                      isPlacedInCurrentHome
                        ? 'bg-slate-100 text-slate-500'
                        : isPlacedInAnotherHome
                          ? 'bg-sky-50 text-sky-600'
                        : placementLimitReached
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-[#fff1fb] text-[#d946ef]'
                    }`}
                    onClick={() => handleCreaturePlacement(ownedCreature.creatureId)}
                    type="button"
                  >
                    {isPlacedInCurrentHome ? (
                      <Check className="h-4 w-4" />
                    ) : isPlacedInAnotherHome ? (
                      <House className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
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

                  {placementLimitReached && (
                    <div className="mt-2 rounded-full bg-rose-50 px-2 py-1 text-center text-[10px] font-bold text-rose-500">
                      החדר מלא
                    </div>
                  )}

                  {isPlacedInAnotherHome && (
                    <div className="mt-2 rounded-full bg-sky-50 px-2 py-1 text-center text-[10px] font-bold text-sky-600">
                      {assignedHomeWorld?.name ?? 'בְּחֶדֶר אַחֵר'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {placementMessage && (
        <div className="absolute inset-x-0 top-20 z-[60] flex justify-center px-4">
          <div className="rounded-full border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,239,247,0.93))] px-5 py-3 text-sm font-bold text-[#be185d] shadow-[0_18px_40px_rgba(56,37,87,0.18)] backdrop-blur">
            {placementMessage}
          </div>
        </div>
      )}

      {placedRoomProps.map((placedProp) => {
        const item = getShopItemById(placedProp.itemId)

        if (!item || item.category !== 'Props') {
          return null
        }

        return (
          <div
            className="pointer-events-none absolute z-[12] -translate-x-1/2 -translate-y-1/2"
            key={`${placedProp.homeWorldId}:${placedProp.itemId}`}
            style={{
              left: `${placedProp.x}%`,
              top: `${placedProp.y}%`,
            }}
          >
            <div className="relative flex items-center justify-center">
              <div
                className="absolute inset-x-6 bottom-1 h-6 rounded-full bg-[rgba(86,63,118,0.18)] blur-md"
                style={{ transform: 'translateY(18px) scale(1.05)' }}
              />
              {item.image ? (
                <img
                  alt={item.name}
                  className="max-h-[170px] max-w-[220px] object-contain drop-shadow-[0_18px_34px_rgba(86,63,118,0.16)]"
                  src={item.image}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/88 text-5xl shadow-[0_18px_34px_rgba(86,63,118,0.12)]">
                  {item.icon}
                </div>
              )}
            </div>
          </div>
        )
      })}

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
          const specialRequestState = specialRequestByCreatureId[ownedCreature.creatureId] ?? null
          const specialRequest = specialRequestState?.requestId
            ? getCreatureSpecialRequestById(specialRequestState.requestId)
            : null
          const isSelected = resolvedSelectedCreatureId === ownedCreature.creatureId
          const bob = Math.sin((sceneCreature.phase / 24) * Math.PI * 2) * (sceneCreature.pauseTicks ? 2 : 5)
          const jumpStepCount = Math.max(1, sceneCreature.jumpDurationTicks - 1)
          const jumpProgress =
            sceneCreature.jumpTicksRemaining > 0
              ? Math.sin(((sceneCreature.jumpDurationTicks - sceneCreature.jumpTicksRemaining) / jumpStepCount) * Math.PI)
              : 0
          const jumpLift = jumpProgress * 18
          const creatureScale = (pulse ? 1.08 : isSelected ? 1.04 : 1) * (1 + jumpProgress * 0.02)
          const creatureAnimationClass = getCreatureAnimationClass(pulse, sceneCreature.jumpTicksRemaining > 0)
          const NeedIcon = needs?.primaryNeed ? careIcons[needs.primaryNeed] : null
          const showHeartMeter = hatched && (needs?.primaryNeed === 'pet' || heartProgress > 0)
          const showFeedMeter = hatched && (needs?.primaryNeed === 'feed' || feedProgress > 0)
          const showNeedBubble = hatched && needs?.primaryNeed && needs.primaryNeed !== 'pet' && needs.primaryNeed !== 'feed' && NeedIcon
          const showSpecialRequestBubble =
            hatched &&
            specialRequest &&
            !needs?.primaryNeed &&
            heartProgress < 0.01 &&
            feedProgress < 0.01
          const showStarReward = starRewardCreatureId === ownedCreature.creatureId
          const interactionOffset = interactionOffsetByCreatureId[ownedCreature.creatureId] ?? { x: 0, y: 0 }

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

	                {showSpecialRequestBubble && (
	                  <button
	                    className={`absolute left-3 top-6 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-[0_18px_40px_rgba(56,37,87,0.16)] ring-2 transition hover:scale-[1.02] ${
	                      specialRequest!.bubbleClass
	                    }`}
	                    onClick={(event) => {
	                      event.stopPropagation()
	                      if (getSpecialRequestInteraction(specialRequest!.id) === 'tap') {
                          if (specialRequest!.requiredItemId) {
                            setSelectedCreatureId(ownedCreature.creatureId)
                            setOpenPanel('props')
                            showReaction(ownedCreature.creatureId, specialRequest!.hintEmoji ?? specialRequest!.emoji)
                            return
                          }
	                        handleSpecialRequestTap(ownedCreature.creatureId)
	                        return
	                      }

	                      setSelectedCreatureId(ownedCreature.creatureId)
                        if (specialRequest!.requiredItemId) {
                          setOpenPanel('props')
                        }
	                      showReaction(ownedCreature.creatureId, specialRequest!.hintEmoji ?? specialRequest!.emoji)
	                    }}
	                    onPointerDown={(event) => event.stopPropagation()}
	                    style={{
	                      transform: `scaleX(${hatched ? sceneCreature.directionX : 1})`,
	                    }}
	                    type="button"
	                  >
	                    <span className="text-xl leading-none">{specialRequest!.emoji}</span>
	                  </button>
	                )}

	                {showNeedBubble && (
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
	                )}

	                <div
	                  className="pointer-events-none absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center transition"
	                  style={{
	                    transform: `translate(${interactionOffset.x}px, ${bob - jumpLift + interactionOffset.y}px) scale(${creatureScale})`,
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
	                              : pulse === 'cheer'
	                                ? 'bg-[#fbcfe8]'
	                                : pulse === 'curious'
	                                  ? 'bg-[#bae6fd]'
	                                  : pulse === 'stretch'
	                                    ? 'bg-[#bbf7d0]'
	                                    : pulse === 'soar'
	                                      ? 'bg-[#bfdbfe]'
	                                      : pulse === 'snuggle'
	                                        ? 'bg-[#fecdd3]'
	                                : pulse === 'sway'
	                                  ? 'bg-[#fde68a]'
	                                  : pulse === 'twirl'
	                                    ? 'bg-[#ddd6fe]'
	                                    : pulse === 'zoom'
	                                      ? 'bg-[#bbf7d0]'
	                                      : pulse === 'boing'
	                                        ? 'bg-[#fdba74]'
	                                        : pulse === 'doze'
	                                          ? 'bg-[#c4b5fd]'
	                                          : pulse === 'bow'
	                                            ? 'bg-[#bbf7d0]'
	                                            : pulse === 'sniffle'
	                                              ? 'bg-[#bae6fd]'
	                                              : pulse === 'dig'
	                                                ? 'bg-[#fed7aa]'
	                                                : pulse === 'shake'
	                                                  ? 'bg-[#fbcfe8]'
	                                                  : pulse === 'sprint'
	                                                    ? 'bg-[#fcd34d]'
	                                                    : pulse === 'nest'
	                                                      ? 'bg-[#fecdd3]'
	                                    : isSelected
	                                      ? 'bg-[#ffb6dc]/65'
	                                      : 'bg-[#c9edff]/65'
	                    }`}
	                    style={{
	                      opacity: 0.72 - jumpProgress * 0.18,
	                      transform: `scale(${1 - jumpProgress * 0.14})`,
	                    }}
	                  />
	                  {reaction && (
	                    <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 text-3xl puppy-reaction">
	                      {reaction}
	                    </div>
	                  )}
	                  {showStarReward && (
	                    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
	                      ⭐
	                    </div>
	                  )}
	                  <div className={`relative flex items-center justify-center ${creatureAnimationClass}`}>
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
          className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-white/96 px-4 py-3 shadow-[0_24px_60px_rgba(84,60,126,0.2)]"
          style={{ left: draggedTrayItem.x, top: draggedTrayItem.y }}
        >
          {draggedTrayItem.image ? (
            <img
              alt={draggedTrayItem.itemName ?? ''}
              className="h-20 w-24 object-contain drop-shadow-[0_16px_26px_rgba(86,63,118,0.16)]"
              src={draggedTrayItem.image}
            />
          ) : (
            <div className="text-4xl">{draggedTrayItem.emoji}</div>
          )}
        </div>
      )}
    </div>
  )
}
