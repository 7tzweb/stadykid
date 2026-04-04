import { createContext } from 'react'

import type {
  AppUser,
  AvatarSelection,
  ChildProfile,
  CreatureCareAction,
  CreaturePurchasePrice,
  CreaturePlacementResult,
  CreaturePurchaseResult,
  DailyLimits,
  ExperienceMode,
  GameSettings,
  GameState,
  LevelTrack,
  MissionOutcome,
  PlacedProp,
  ShopPurchasePrice,
  ShopPurchaseResult,
} from '@/types/models'

export interface CompleteMissionInput {
  levelId: string
  worldId: string
  subject: string
  levelTrack: LevelTrack
  score: number
  xpEarned: number
  coinsEarned: number
  starsEarned?: number
  starsAlreadyGranted?: boolean
  explanation: string
}

export interface GameContextValue extends GameState {
  currentChildProfile: ChildProfile | null
  isAdminMode: boolean
  setCurrentUser: (user: AppUser | null) => void
  setExperienceMode: (mode: ExperienceMode) => void
  toggleExperienceMode: () => void
  setCurrentChildProfile: (childId: string) => void
  setCurrentHomeWorld: (homeWorldId: string) => void
  addChildProfile: (profile: ChildProfile) => void
  updateChildProfile: (profile: ChildProfile) => void
  updateAvatar: (childId: string, avatarSeed: AvatarSelection) => void
  startMission: (levelId: string) => void
  completeMission: (input: CompleteMissionInput) => MissionOutcome
  addXP: (value: number) => void
  addCoins: (value: number) => void
  addStars: (value: number) => void
  buyItem: (itemId: string, price: ShopPurchasePrice) => ShopPurchaseResult
  buyCreature: (creatureId: string, price: CreaturePurchasePrice) => CreaturePurchaseResult
  toggleCreaturePlacement: (creatureId: string, homeWorldId: string) => CreaturePlacementResult
  careForCreature: (creatureId: string, action: CreatureCareAction, rewardStars: number) => boolean
  completeSpecialRequest: (creatureId: string, rewardStars: number) => boolean
  toggleCreatureItem: (creatureId: string, itemId: string) => void
  placeProp: (placement: PlacedProp) => void
  removeProp: (itemId: string) => void
  updateSettings: (input: Partial<GameSettings>) => void
  updateDailyLimits: (input: Partial<DailyLimits>) => void
  resetProgress: () => void
}

export const GameContext = createContext<GameContextValue | null>(null)
