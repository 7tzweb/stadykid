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
import {
  getCompletedLevelIdsForTrack,
  getResolvedActiveLevelTrack,
  totalMissionStageCount,
} from '@/services/levelTrackService'
import type {
  AppUser,
  AvatarSelection,
  ChildProfile,
  CreatureCareAction,
  CreaturePurchasePrice,
  DailyLimits,
  ExperienceMode,
  GameSettings,
  GameState,
  LevelTrack,
  PlacedProp,
  ShopPurchasePrice,
} from '@/types/models'
import { loadStoredExperienceMode, loadStoredSnapshot, persistSnapshot, syncSnapshot } from '@/services/progressService'

const maxCreaturesInHome = 4
const demoUnlockedWorldIds = worldCatalog.map((world) => world.id)
const starterUnlockedWorldIds = [worldCatalog[0]?.id ?? 'forest-of-numbers']
const adminDemoUser: AppUser = {
  id: 'admin-demo',
  name: 'אדמין דמו',
  email: 'admin@demo.gamekids',
}

function cloneChildProfile(profile: ChildProfile): ChildProfile {
  const completedLevelIds = [...profile.completedLevelIds]
  const advancedCompletedLevelIds = [...(profile.advancedCompletedLevelIds ?? [])]

  return {
    ...profile,
    avatarSeed: {
      ...profile.avatarSeed,
    },
    completedLevelIds,
    advancedCompletedLevelIds,
    activeLevelTrack: getResolvedActiveLevelTrack({
      ...profile,
      completedLevelIds,
      advancedCompletedLevelIds,
      activeLevelTrack: profile.activeLevelTrack ?? 'standard',
    }),
    equippedItems: [...profile.equippedItems],
  }
}

function mergeSeedProfiles(childProfiles: ChildProfile[] | undefined) {
  const mergedProfiles = new Map(seedChildProfiles.map((profile) => [profile.id, cloneChildProfile(profile)]))

  childProfiles?.forEach((profile) => {
    mergedProfiles.set(profile.id, cloneChildProfile(profile))
  })

  return [...mergedProfiles.values()].sort((left, right) => left.age - right.age)
}

function createProgressBySubject(completed = 0, accuracy = 0) {
  return {
    math: { completed, total: 8, accuracy },
    reading: { completed, total: 8, accuracy },
    english: { completed, total: 8, accuracy },
    logic: { completed, total: 6, accuracy },
    memory: { completed, total: 6, accuracy },
  }
}

function getDefaultState(mode: ExperienceMode): GameState {
  if (mode === 'player') {
    return {
      experienceMode: 'player',
      currentUser: null,
      childProfiles: [],
      currentChildProfileId: null,
      currentHomeWorldId: homeWorldCatalog[0]?.id ?? 'playroom-1',
      xp: 0,
      coins: 0,
      stars: 40,
      unlockedWorlds: [...starterUnlockedWorldIds],
      progressBySubject: createProgressBySubject(0, 0),
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        language: 'he',
        touchFeedback: true,
      },
      inventory: [],
      placedProps: [],
      ownedCreatures: [],
      currentLevelId: null,
      hearts: 3,
      dailyLimits: {
        enabled: false,
        minutes: 20,
        enabledSubjects: ['math', 'reading', 'english', 'logic', 'memory'],
      },
      lastMissionOutcome: null,
    }
  }

  return {
    experienceMode: 'admin',
    currentUser: adminDemoUser,
    childProfiles: seedChildProfiles.map(cloneChildProfile),
    currentChildProfileId: seedChildProfiles[0]?.id ?? null,
    currentHomeWorldId: homeWorldCatalog[0]?.id ?? 'playroom-1',
    xp: 566,
    coins: 1000,
    stars: 120,
    unlockedWorlds: [...demoUnlockedWorldIds],
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
    inventory: [
      'starlight-cape',
      'moon-pillow',
      'sparkle-ball',
      'flower-sniff-mat',
      'cloud-blanket',
      'rainbow-tunnel',
      'butterfly-ribbon',
      'squeaky-duck',
      'heart-plush',
    ],
    placedProps: [
      {
        itemId: 'moon-pillow',
        homeWorldId: homeWorldCatalog[0]?.id ?? 'playroom-1',
        x: 24,
        y: 74,
      },
    ],
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

type GameAction =
  | { type: 'REPLACE_STATE'; payload: GameState }
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
  | { type: 'BUY_ITEM'; payload: { itemId: string; price: ShopPurchasePrice } }
  | { type: 'BUY_CREATURE'; payload: { creatureId: string; price: CreaturePurchasePrice; purchasedAt: string } }
  | { type: 'TOGGLE_CREATURE_PLACEMENT'; payload: { creatureId: string; homeWorldId: string } }
  | { type: 'CARE_FOR_CREATURE'; payload: { creatureId: string; action: CreatureCareAction; at: string; rewardStars: number } }
  | { type: 'COMPLETE_SPECIAL_REQUEST'; payload: { creatureId: string; rewardStars: number } }
  | { type: 'TOGGLE_CREATURE_ITEM'; payload: { creatureId: string; itemId: string } }
  | { type: 'PLACE_PROP'; payload: PlacedProp }
  | { type: 'REMOVE_PROP'; payload: { itemId: string } }
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

function hydrateState(mode: ExperienceMode) {
  const defaultState = getDefaultState(mode)
  const storedSnapshot = loadStoredSnapshot(mode) as (Partial<GameState> & {
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

  const mergedChildProfiles =
    mode === 'admin'
      ? mergeSeedProfiles(storedSnapshot.childProfiles)
      : (storedSnapshot.childProfiles ?? []).map(cloneChildProfile)
  const currentChildProfileId = mergedChildProfiles.some((profile) => profile.id === storedSnapshot.currentChildProfileId)
    ? storedSnapshot.currentChildProfileId ?? defaultState.currentChildProfileId
    : mergedChildProfiles[0]?.id ?? defaultState.currentChildProfileId

  return {
    ...defaultState,
    ...storedSnapshot,
    experienceMode: mode,
    stars: storedSnapshot.stars ?? defaultState.stars,
    coins: storedSnapshot.coins ?? defaultState.coins,
    childProfiles: mergedChildProfiles,
    currentHomeWorldId: storedSnapshot.currentHomeWorldId ?? defaultState.currentHomeWorldId,
    placedProps: storedSnapshot.placedProps ?? defaultState.placedProps,
    unlockedWorlds:
      mode === 'admin'
        ? Array.from(new Set([...(storedSnapshot.unlockedWorlds ?? []), ...defaultState.unlockedWorlds]))
        : Array.from(new Set(storedSnapshot.unlockedWorlds?.length ? storedSnapshot.unlockedWorlds : defaultState.unlockedWorlds)),
    ownedCreatures: migratedOwnedCreatures.length ? migratedOwnedCreatures : defaultState.ownedCreatures,
    currentChildProfileId,
    lastMissionOutcome: migratedOutcome,
  }
}

function getInitialState() {
  const mode = loadStoredExperienceMode() ?? 'admin'
  return hydrateState(mode)
}

function unlockNextWorld(unlockedWorlds: string[], currentWorldId: string) {
  const currentIndex = worldCatalog.findIndex((world) => world.id === currentWorldId)
  const nextWorld = worldCatalog[currentIndex + 1]

  if (!nextWorld || unlockedWorlds.includes(nextWorld.id)) {
    return unlockedWorlds
  }

  return [...unlockedWorlds, nextWorld.id]
}

function upsertCompletedLevel(state: GameState, levelId: string, levelTrack: LevelTrack) {
  return state.childProfiles.map((profile) => {
    if (profile.id !== state.currentChildProfileId) {
      return profile
    }

    if (getCompletedLevelIdsForTrack(profile, levelTrack).includes(levelId)) {
      return profile
    }

    const relatedMission = missionCatalog.find((mission) => mission.levelId === levelId)
    const nextLevel = Math.max(profile.level, profile.level + (relatedMission ? 1 : 0))
    const nextStandardCompletedLevelIds =
      levelTrack === 'standard' ? [...profile.completedLevelIds, levelId] : [...profile.completedLevelIds]
    const nextAdvancedCompletedLevelIds =
      levelTrack === 'advanced'
        ? [...(profile.advancedCompletedLevelIds ?? []), levelId]
        : [...(profile.advancedCompletedLevelIds ?? [])]
    const nextActiveLevelTrack =
      levelTrack === 'standard' && nextStandardCompletedLevelIds.length >= totalMissionStageCount
        ? 'advanced'
        : profile.activeLevelTrack

    return {
      ...profile,
      level: nextLevel,
      completedLevelIds: nextStandardCompletedLevelIds,
      advancedCompletedLevelIds: nextAdvancedCompletedLevelIds,
      activeLevelTrack: nextActiveLevelTrack,
    }
  })
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'REPLACE_STATE':
      return action.payload

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
      const normalizedProfile = cloneChildProfile(action.payload)
      const exists = state.childProfiles.some((profile) => profile.id === normalizedProfile.id)

      return {
        ...state,
        childProfiles: exists
          ? state.childProfiles.map((profile) =>
              profile.id === normalizedProfile.id ? normalizedProfile : profile,
            )
          : [...state.childProfiles, normalizedProfile],
        currentChildProfileId: normalizedProfile.id,
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
      const currentChildProfile = state.childProfiles.find((profile) => profile.id === state.currentChildProfileId)
      const starsEarned =
        action.payload.starsEarned ??
        (action.payload.score >= 95 ? 3 : action.payload.score >= 80 ? 2 : 1)
      const alreadyCompleted = getCompletedLevelIdsForTrack(currentChildProfile, action.payload.levelTrack).includes(
        action.payload.levelId,
      )
      const resolvedStarsEarned = alreadyCompleted ? 0 : starsEarned
      const shouldAddStarsToBalance = !alreadyCompleted && !action.payload.starsAlreadyGranted

      return {
        ...state,
        xp: alreadyCompleted ? state.xp : state.xp + action.payload.xpEarned,
        coins: alreadyCompleted ? state.coins : state.coins + action.payload.coinsEarned,
        stars: shouldAddStarsToBalance ? state.stars + resolvedStarsEarned : state.stars,
        currentLevelId: null,
        childProfiles: alreadyCompleted
          ? state.childProfiles
          : upsertCompletedLevel(state, action.payload.levelId, action.payload.levelTrack),
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
          levelTrack: action.payload.levelTrack,
          score: action.payload.score,
          xpEarned: action.payload.xpEarned,
          coinsEarned: action.payload.coinsEarned,
          starsEarned: resolvedStarsEarned,
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
      if (
        (action.payload.price.currency === 'coins' && state.coins < action.payload.price.amount) ||
        (action.payload.price.currency === 'stars' && state.stars < action.payload.price.amount) ||
        state.inventory.includes(action.payload.itemId)
      ) {
        return state
      }

      return {
        ...state,
        coins:
          action.payload.price.currency === 'coins'
            ? state.coins - action.payload.price.amount
            : state.coins,
        stars:
          action.payload.price.currency === 'stars'
            ? state.stars - action.payload.price.amount
            : state.stars,
        inventory: [...state.inventory, action.payload.itemId],
      }

    case 'BUY_CREATURE':
      if (
        (action.payload.price.currency === 'stars' && state.stars < action.payload.price.amount) ||
        (action.payload.price.currency === 'coins' && state.coins < action.payload.price.amount) ||
        state.ownedCreatures.some((creature) => creature.creatureId === action.payload.creatureId)
      ) {
        return state
      }

      return {
        ...state,
        stars:
          action.payload.price.currency === 'stars'
            ? state.stars - action.payload.price.amount
            : state.stars,
        coins:
          action.payload.price.currency === 'coins'
            ? state.coins - action.payload.price.amount
            : state.coins,
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

    case 'PLACE_PROP': {
      if (!state.inventory.includes(action.payload.itemId)) {
        return state
      }

      const itemAlreadyPlacedIndex = state.placedProps.findIndex((placedProp) => placedProp.itemId === action.payload.itemId)

      if (itemAlreadyPlacedIndex === -1) {
        return {
          ...state,
          placedProps: [...state.placedProps, action.payload],
        }
      }

      return {
        ...state,
        placedProps: state.placedProps.map((placedProp) =>
          placedProp.itemId === action.payload.itemId ? action.payload : placedProp,
        ),
      }
    }

    case 'REMOVE_PROP':
      return {
        ...state,
        placedProps: state.placedProps.filter((placedProp) => placedProp.itemId !== action.payload.itemId),
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

    case 'RESET_PROGRESS': {
      const resetDefaultState = getDefaultState(state.experienceMode)
      const resetProfiles: ChildProfile[] =
        state.experienceMode === 'admin'
          ? resetDefaultState.childProfiles.map(cloneChildProfile)
          : state.childProfiles.map((profile) => ({
              ...profile,
              completedLevelIds: [],
              advancedCompletedLevelIds: [],
              activeLevelTrack: 'standard' as LevelTrack,
              level: 1,
            }))

      return {
        ...resetDefaultState,
        currentUser: state.currentUser,
        childProfiles: resetProfiles,
        currentChildProfileId:
          resetProfiles.find((profile) => profile.id === state.currentChildProfileId)?.id ??
          resetProfiles[0]?.id ??
          resetDefaultState.currentChildProfileId,
        currentHomeWorldId: resetDefaultState.currentHomeWorldId,
      }
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
    isAdminMode: state.experienceMode === 'admin',
    setCurrentUser(user) {
      dispatch({ type: 'SET_USER', payload: user })
    },
    setExperienceMode(mode) {
      dispatch({ type: 'REPLACE_STATE', payload: hydrateState(mode) })
    },
    toggleExperienceMode() {
      dispatch({
        type: 'REPLACE_STATE',
        payload: hydrateState(state.experienceMode === 'admin' ? 'player' : 'admin'),
      })
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
      const profile = state.childProfiles.find((nextProfile) => nextProfile.id === state.currentChildProfileId)
      const alreadyCompleted = getCompletedLevelIdsForTrack(profile, input.levelTrack).includes(input.levelId)
      const starsEarned =
        input.starsEarned ?? (input.score >= 95 ? 3 : input.score >= 80 ? 2 : 1)

      dispatch({ type: 'COMPLETE_MISSION', payload: input })

      return {
        success: true,
        levelId: input.levelId,
        levelTrack: input.levelTrack,
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
      if (state.inventory.includes(itemId)) {
        return 'owned'
      }

      if (price.currency === 'stars' && state.stars < price.amount) {
        return 'insufficient-stars'
      }

      if (price.currency === 'coins' && state.coins < price.amount) {
        return 'insufficient-coins'
      }

      dispatch({ type: 'BUY_ITEM', payload: { itemId, price } })
      return 'success'
    },
    buyCreature(creatureId, price) {
      if (state.ownedCreatures.some((creature) => creature.creatureId === creatureId)) {
        return 'owned'
      }

      if (price.currency === 'stars' && state.stars < price.amount) {
        return 'insufficient-stars'
      }

      if (price.currency === 'coins' && state.coins < price.amount) {
        return 'insufficient-coins'
      }

      dispatch({
        type: 'BUY_CREATURE',
        payload: { creatureId, price, purchasedAt: new Date().toISOString() },
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
    placeProp(placement) {
      dispatch({ type: 'PLACE_PROP', payload: placement })
    },
    removeProp(itemId) {
      dispatch({ type: 'REMOVE_PROP', payload: { itemId } })
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
