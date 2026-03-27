import {
  useEffect,
  useEffectEvent,
  useReducer,
  type ReactNode,
} from 'react'

import { createOwnedCreature, creatureCatalog } from '@/game/content/creatures'
import { homeWorldCatalog } from '@/game/content/home-worlds'
import { missionCatalog, seedChildProfiles, worldCatalog } from '@/game/content/catalog'
import { GameContext, type CompleteMissionInput, type GameContextValue } from '@/store/game-context'
import type {
  AppUser,
  AvatarSelection,
  ChildProfile,
  CreatureCareAction,
  DailyLimits,
  GameSettings,
  GameState,
} from '@/types/models'
import { loadStoredSnapshot, persistSnapshot, syncSnapshot } from '@/services/progressService'

const maxCreaturesInHome = 4
const demoUnlockedWorldIds = worldCatalog.map((world) => world.id)

function mergeSeedProfiles(childProfiles: ChildProfile[] | undefined) {
  const mergedProfiles = new Map(seedChildProfiles.map((profile) => [profile.id, profile]))

  childProfiles?.forEach((profile) => {
    mergedProfiles.set(profile.id, profile)
  })

  return [...mergedProfiles.values()].sort((left, right) => left.age - right.age)
}

function normalizeOwnedCreaturePlacement(creature: GameState['ownedCreatures'][number], fallbackHomeWorldId: string) {
  const placedHomeWorldId =
    typeof creature.placedHomeWorldId === 'string'
      ? creature.placedHomeWorldId
      : creature.placedInHome
        ? fallbackHomeWorldId
        : null

  return {
    ...creature,
    placedInHome: Boolean(placedHomeWorldId),
    placedHomeWorldId,
    specialRequestCount: typeof creature.specialRequestCount === 'number' ? creature.specialRequestCount : 0,
  }
}

const defaultState: GameState = {
  currentUser: null,
  childProfiles: seedChildProfiles,
  currentChildProfileId: seedChildProfiles[0]?.id ?? null,
  currentHomeWorldId: homeWorldCatalog[0]?.id ?? 'playroom-1',
  xp: 420,
  coins: 135,
  stars: 28,
  unlockedWorlds: demoUnlockedWorldIds,
  progressBySubject: {
    math: { completed: 3, total: 8, accuracy: 92 },
    reading: { completed: 2, total: 8, accuracy: 84 },
    english: { completed: 1, total: 8, accuracy: 77 },
    logic: { completed: 1, total: 6, accuracy: 80 },
    memory: { completed: 2, total: 6, accuracy: 89 },
  },
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    language: 'he',
    touchFeedback: true,
  },
  inventory: ['starlight-cape'],
  ownedCreatures: [
    {
      ...createOwnedCreature('sun-corgi', '2026-03-12T08:00:00.000Z'),
      placedInHome: true,
      placedHomeWorldId: homeWorldCatalog[0]?.id ?? 'playroom-1',
      lastFedAt: '2026-03-13T08:00:00.000Z',
      lastPettedAt: '2026-03-13T09:00:00.000Z',
      lastPlayedAt: '2026-03-13T10:00:00.000Z',
      lastRestedAt: '2026-03-13T11:00:00.000Z',
      care: {
        feedCount: 2,
        petCount: 2,
        playCount: 1,
        restCount: 1,
      },
    },
  ],
  currentLevelId: null,
  hearts: 3,
  dailyLimits: {
    enabled: true,
    minutes: 25,
    enabledSubjects: ['math', 'reading', 'english', 'logic', 'memory'],
  },
  lastMissionOutcome: null,
}

type GameAction =
  | { type: 'SET_USER'; payload: AppUser | null }
  | { type: 'SET_CURRENT_CHILD'; payload: string }
  | { type: 'SET_CURRENT_HOME_WORLD'; payload: string }
  | { type: 'UPSERT_CHILD'; payload: ChildProfile }
  | { type: 'UPDATE_AVATAR'; payload: { childId: string; avatarSeed: AvatarSelection } }
  | { type: 'START_MISSION'; payload: string }
  | {
      type: 'COMPLETE_MISSION'
      payload: CompleteMissionInput
    }
  | { type: 'ADD_XP'; payload: number }
  | { type: 'ADD_COINS'; payload: number }
  | { type: 'ADD_STARS'; payload: number }
  | { type: 'BUY_ITEM'; payload: { itemId: string; price: number } }
  | { type: 'BUY_CREATURE'; payload: { creatureId: string; priceStars: number; purchasedAt: string } }
  | { type: 'TOGGLE_CREATURE_PLACEMENT'; payload: { creatureId: string; homeWorldId: string } }
  | { type: 'CARE_FOR_CREATURE'; payload: { creatureId: string; action: CreatureCareAction; at: string; rewardStars: number } }
  | { type: 'COMPLETE_SPECIAL_REQUEST'; payload: { creatureId: string; rewardStars: number } }
  | { type: 'TOGGLE_CREATURE_ITEM'; payload: { creatureId: string; itemId: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | { type: 'UPDATE_DAILY_LIMITS'; payload: Partial<DailyLimits> }
  | { type: 'RESET_PROGRESS' }

function migrateLegacyPetEggs(
  petEggs: Array<{ eggId: string; purchasedAt: string }> | undefined,
) {
  if (!petEggs?.length) {
    return []
  }

  const creatureIdByEggId = creatureCatalog.reduce<Record<string, string>>((mapping, creature) => {
    mapping[`${creature.id}-egg`] = creature.id
    return mapping
  }, {})

  return petEggs.flatMap((egg) => {
    const creatureId = creatureIdByEggId[egg.eggId]

    if (!creatureId) {
      return []
    }

    return createOwnedCreature(creatureId, egg.purchasedAt)
  })
}

function getInitialState() {
  const storedSnapshot = loadStoredSnapshot() as (Partial<GameState> & {
    petEggs?: Array<{ eggId: string; purchasedAt: string }>
  }) | null

  if (!storedSnapshot) {
    return defaultState
  }

  const migratedOwnedCreatures =
    storedSnapshot.ownedCreatures?.length
      ? storedSnapshot.ownedCreatures.map((creature) =>
          normalizeOwnedCreaturePlacement(creature, storedSnapshot.currentHomeWorldId ?? defaultState.currentHomeWorldId),
        )
      : migrateLegacyPetEggs(storedSnapshot.petEggs)

  const migratedOutcome = storedSnapshot.lastMissionOutcome
    ? {
        ...storedSnapshot.lastMissionOutcome,
        starsEarned:
          storedSnapshot.lastMissionOutcome.starsEarned ??
          (storedSnapshot.lastMissionOutcome.score >= 95
            ? 3
            : storedSnapshot.lastMissionOutcome.score >= 80
              ? 2
              : 1),
      }
    : null

  const mergedChildProfiles = mergeSeedProfiles(storedSnapshot.childProfiles)
  const currentChildProfileId = mergedChildProfiles.some((profile) => profile.id === storedSnapshot.currentChildProfileId)
    ? storedSnapshot.currentChildProfileId ?? defaultState.currentChildProfileId
    : mergedChildProfiles[0]?.id ?? defaultState.currentChildProfileId

  return {
    ...defaultState,
    ...storedSnapshot,
    stars: storedSnapshot.stars ?? defaultState.stars,
    childProfiles: mergedChildProfiles,
    currentHomeWorldId: storedSnapshot.currentHomeWorldId ?? defaultState.currentHomeWorldId,
    unlockedWorlds: Array.from(new Set([...(storedSnapshot.unlockedWorlds ?? []), ...defaultState.unlockedWorlds])),
    ownedCreatures: migratedOwnedCreatures.length ? migratedOwnedCreatures : defaultState.ownedCreatures,
    currentChildProfileId,
    lastMissionOutcome: migratedOutcome,
  }
}

function unlockNextWorld(unlockedWorlds: string[], currentWorldId: string) {
  const currentIndex = worldCatalog.findIndex((world) => world.id === currentWorldId)
  const nextWorld = worldCatalog[currentIndex + 1]

  if (!nextWorld || unlockedWorlds.includes(nextWorld.id)) {
    return unlockedWorlds
  }

  return [...unlockedWorlds, nextWorld.id]
}

function upsertCompletedLevel(state: GameState, levelId: string) {
  return state.childProfiles.map((profile) => {
    if (profile.id !== state.currentChildProfileId) {
      return profile
    }

    if (profile.completedLevelIds.includes(levelId)) {
      return profile
    }

    const relatedMission = missionCatalog.find((mission) => mission.levelId === levelId)
    const nextLevel = Math.max(profile.level, profile.level + (relatedMission ? 1 : 0))

    return {
      ...profile,
      level: nextLevel,
      completedLevelIds: [...profile.completedLevelIds, levelId],
    }
  })
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        currentUser: action.payload,
      }

    case 'SET_CURRENT_CHILD':
      return {
        ...state,
        currentChildProfileId: action.payload,
      }

    case 'SET_CURRENT_HOME_WORLD':
      return {
        ...state,
        currentHomeWorldId: action.payload,
      }

    case 'UPSERT_CHILD': {
      const exists = state.childProfiles.some((profile) => profile.id === action.payload.id)

      return {
        ...state,
        childProfiles: exists
          ? state.childProfiles.map((profile) =>
              profile.id === action.payload.id ? action.payload : profile,
            )
          : [...state.childProfiles, action.payload],
        currentChildProfileId: action.payload.id,
      }
    }

    case 'UPDATE_AVATAR':
      return {
        ...state,
        childProfiles: state.childProfiles.map((profile) =>
          profile.id === action.payload.childId
            ? {
                ...profile,
                avatarSeed: action.payload.avatarSeed,
              }
            : profile,
        ),
      }

    case 'START_MISSION':
      return {
        ...state,
        currentLevelId: action.payload,
        hearts: 3,
      }

    case 'COMPLETE_MISSION': {
      const previousProgress = state.progressBySubject[action.payload.subject] ?? {
        completed: 0,
        total: 6,
        accuracy: 0,
      }
      const starsEarned =
        action.payload.starsEarned ??
        (action.payload.score >= 95 ? 3 : action.payload.score >= 80 ? 2 : 1)
      const alreadyCompleted = state.childProfiles
        .find((profile) => profile.id === state.currentChildProfileId)
        ?.completedLevelIds.includes(action.payload.levelId)

      return {
        ...state,
        xp: alreadyCompleted ? state.xp : state.xp + action.payload.xpEarned,
        coins: alreadyCompleted ? state.coins : state.coins + action.payload.coinsEarned,
        stars: alreadyCompleted ? state.stars : state.stars + starsEarned,
        currentLevelId: null,
        childProfiles: alreadyCompleted
          ? state.childProfiles
          : upsertCompletedLevel(state, action.payload.levelId),
        progressBySubject: {
          ...state.progressBySubject,
          [action.payload.subject]: {
            completed: alreadyCompleted
              ? previousProgress.completed
              : Math.min(previousProgress.total, previousProgress.completed + 1),
            total: previousProgress.total,
            accuracy: Math.round((previousProgress.accuracy + action.payload.score) / 2),
          },
        },
        unlockedWorlds: unlockNextWorld(state.unlockedWorlds, action.payload.worldId),
        lastMissionOutcome: {
          success: true,
          levelId: action.payload.levelId,
          score: action.payload.score,
          xpEarned: action.payload.xpEarned,
          coinsEarned: action.payload.coinsEarned,
          starsEarned,
          explanation: action.payload.explanation,
        },
      }
    }

    case 'ADD_XP':
      return {
        ...state,
        xp: state.xp + action.payload,
      }

    case 'ADD_COINS':
      return {
        ...state,
        coins: state.coins + action.payload,
      }

    case 'ADD_STARS':
      return {
        ...state,
        stars: state.stars + action.payload,
      }

    case 'BUY_ITEM':
      if (state.coins < action.payload.price || state.inventory.includes(action.payload.itemId)) {
        return state
      }

      return {
        ...state,
        coins: state.coins - action.payload.price,
        inventory: [...state.inventory, action.payload.itemId],
      }

    case 'BUY_CREATURE':
      if (
        state.stars < action.payload.priceStars ||
        state.ownedCreatures.some((creature) => creature.creatureId === action.payload.creatureId)
      ) {
        return state
      }

      return {
        ...state,
        stars: state.stars - action.payload.priceStars,
        ownedCreatures: [
          ...state.ownedCreatures,
          createOwnedCreature(action.payload.creatureId, action.payload.purchasedAt),
        ],
      }

    case 'TOGGLE_CREATURE_PLACEMENT':
      if (
        !state.ownedCreatures.find((creature) => creature.creatureId === action.payload.creatureId)
      ) {
        return state
      }

      if (
        state.ownedCreatures.find((creature) => creature.creatureId === action.payload.creatureId)?.placedHomeWorldId !==
          action.payload.homeWorldId &&
        state.ownedCreatures.find((creature) => creature.creatureId === action.payload.creatureId)?.placedHomeWorldId
      ) {
        return state
      }

      if (
        state.ownedCreatures.find((creature) => creature.creatureId === action.payload.creatureId)?.placedHomeWorldId !==
          action.payload.homeWorldId &&
        state.ownedCreatures.filter((creature) => creature.placedHomeWorldId === action.payload.homeWorldId).length >=
          maxCreaturesInHome
      ) {
        return state
      }

      return {
        ...state,
        ownedCreatures: state.ownedCreatures.map((creature) =>
          creature.creatureId === action.payload.creatureId
            ? {
                ...creature,
                placedInHome: creature.placedHomeWorldId !== action.payload.homeWorldId,
                placedHomeWorldId:
                  creature.placedHomeWorldId === action.payload.homeWorldId ? null : action.payload.homeWorldId,
              }
            : creature,
        ),
      }

    case 'CARE_FOR_CREATURE': {
      const timestampKey =
        action.payload.action === 'feed'
          ? 'lastFedAt'
          : action.payload.action === 'pet'
            ? 'lastPettedAt'
            : action.payload.action === 'play'
              ? 'lastPlayedAt'
              : 'lastRestedAt'
      const counterKey =
        action.payload.action === 'feed'
          ? 'feedCount'
          : action.payload.action === 'pet'
            ? 'petCount'
            : action.payload.action === 'play'
              ? 'playCount'
              : 'restCount'

      return {
        ...state,
        stars: state.stars + action.payload.rewardStars,
        ownedCreatures: state.ownedCreatures.map((creature) =>
          creature.creatureId === action.payload.creatureId
            ? {
                ...creature,
                [timestampKey]: action.payload.at,
                care: {
                  ...creature.care,
                  [counterKey]: creature.care[counterKey] + 1,
                },
              }
            : creature,
        ),
      }
    }

    case 'COMPLETE_SPECIAL_REQUEST':
      return {
        ...state,
        stars: state.stars + action.payload.rewardStars,
        ownedCreatures: state.ownedCreatures.map((creature) =>
          creature.creatureId === action.payload.creatureId
            ? {
                ...creature,
                specialRequestCount: creature.specialRequestCount + 1,
              }
            : creature,
        ),
      }

    case 'TOGGLE_CREATURE_ITEM':
      return {
        ...state,
        ownedCreatures: state.ownedCreatures.map((creature) => {
          if (creature.creatureId !== action.payload.creatureId || !state.inventory.includes(action.payload.itemId)) {
            return creature
          }

          const equippedItems = creature.equippedItems.includes(action.payload.itemId)
            ? creature.equippedItems.filter((itemId) => itemId !== action.payload.itemId)
            : creature.equippedItems.length >= 4
              ? creature.equippedItems
              : [...creature.equippedItems, action.payload.itemId]

          return {
            ...creature,
            equippedItems,
          }
        }),
      }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      }

    case 'UPDATE_DAILY_LIMITS':
      return {
        ...state,
        dailyLimits: {
          ...state.dailyLimits,
          ...action.payload,
        },
      }

    case 'RESET_PROGRESS':
      return {
        ...defaultState,
        currentUser: state.currentUser,
        childProfiles: state.childProfiles.map((profile) => ({
          ...profile,
          completedLevelIds: [],
          level: 1,
        })),
        currentChildProfileId: state.currentChildProfileId,
        currentHomeWorldId: defaultState.currentHomeWorldId,
      }

    default:
      return state
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState)

  const persistStateEffect = useEffectEvent((snapshot: GameState) => {
    persistSnapshot(snapshot)
    void syncSnapshot(snapshot)
  })

  useEffect(() => {
    persistStateEffect(state)
  }, [state])

  const currentChildProfile =
    state.childProfiles.find((profile) => profile.id === state.currentChildProfileId) ?? null

  const value: GameContextValue = {
    ...state,
    currentChildProfile,
    setCurrentUser(user) {
      dispatch({ type: 'SET_USER', payload: user })
    },
    setCurrentChildProfile(childId) {
      dispatch({ type: 'SET_CURRENT_CHILD', payload: childId })
    },
    setCurrentHomeWorld(homeWorldId) {
      if (!homeWorldCatalog.some((homeWorld) => homeWorld.id === homeWorldId)) {
        return
      }

      dispatch({ type: 'SET_CURRENT_HOME_WORLD', payload: homeWorldId })
    },
    addChildProfile(profile) {
      dispatch({ type: 'UPSERT_CHILD', payload: profile })
    },
    updateChildProfile(profile) {
      dispatch({ type: 'UPSERT_CHILD', payload: profile })
    },
    updateAvatar(childId, avatarSeed) {
      dispatch({ type: 'UPDATE_AVATAR', payload: { childId, avatarSeed } })
    },
    startMission(levelId) {
      dispatch({ type: 'START_MISSION', payload: levelId })
    },
    completeMission(input) {
      const alreadyCompleted = state.childProfiles
        .find((profile) => profile.id === state.currentChildProfileId)
        ?.completedLevelIds.includes(input.levelId)
      const starsEarned =
        input.starsEarned ?? (input.score >= 95 ? 3 : input.score >= 80 ? 2 : 1)

      dispatch({ type: 'COMPLETE_MISSION', payload: input })

      return {
        success: true,
        levelId: input.levelId,
        score: input.score,
        xpEarned: alreadyCompleted ? 0 : input.xpEarned,
        coinsEarned: alreadyCompleted ? 0 : input.coinsEarned,
        starsEarned: alreadyCompleted ? 0 : starsEarned,
        explanation: input.explanation,
      }
    },
    addXP(value) {
      dispatch({ type: 'ADD_XP', payload: value })
    },
    addCoins(value) {
      dispatch({ type: 'ADD_COINS', payload: value })
    },
    addStars(value) {
      dispatch({ type: 'ADD_STARS', payload: value })
    },
    buyItem(itemId, price) {
      if (state.coins < price || state.inventory.includes(itemId)) {
        return false
      }

      dispatch({ type: 'BUY_ITEM', payload: { itemId, price } })
      return true
    },
    buyCreature(creatureId, priceStars) {
      if (state.ownedCreatures.some((creature) => creature.creatureId === creatureId)) {
        return 'owned'
      }

      if (state.stars < priceStars) {
        return 'insufficient-stars'
      }

      dispatch({
        type: 'BUY_CREATURE',
        payload: { creatureId, priceStars, purchasedAt: new Date().toISOString() },
      })
      return 'success'
    },
    toggleCreaturePlacement(creatureId, homeWorldId) {
      const ownedCreature = state.ownedCreatures.find((creature) => creature.creatureId === creatureId)

      if (!ownedCreature) {
        return 'room-full'
      }

      if (ownedCreature.placedHomeWorldId === homeWorldId) {
        dispatch({ type: 'TOGGLE_CREATURE_PLACEMENT', payload: { creatureId, homeWorldId } })
        return 'removed'
      }

      if (ownedCreature.placedHomeWorldId && ownedCreature.placedHomeWorldId !== homeWorldId) {
        return 'assigned-other-room'
      }

      if (state.ownedCreatures.filter((creature) => creature.placedHomeWorldId === homeWorldId).length >= maxCreaturesInHome) {
        return 'room-full'
      }

      dispatch({ type: 'TOGGLE_CREATURE_PLACEMENT', payload: { creatureId, homeWorldId } })
      return 'placed'
    },
    careForCreature(creatureId, action, rewardStars) {
      if (!state.ownedCreatures.some((creature) => creature.creatureId === creatureId)) {
        return false
      }

      dispatch({
        type: 'CARE_FOR_CREATURE',
        payload: { creatureId, action, at: new Date().toISOString(), rewardStars },
      })
      return true
    },
    completeSpecialRequest(creatureId, rewardStars) {
      if (!state.ownedCreatures.some((creature) => creature.creatureId === creatureId)) {
        return false
      }

      dispatch({
        type: 'COMPLETE_SPECIAL_REQUEST',
        payload: { creatureId, rewardStars },
      })
      return true
    },
    toggleCreatureItem(creatureId, itemId) {
      dispatch({ type: 'TOGGLE_CREATURE_ITEM', payload: { creatureId, itemId } })
    },
    updateSettings(input) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: input })
    },
    updateDailyLimits(input) {
      dispatch({ type: 'UPDATE_DAILY_LIMITS', payload: input })
    },
    resetProgress() {
      dispatch({ type: 'RESET_PROGRESS' })
    },
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
