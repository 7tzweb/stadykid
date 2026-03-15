import { createContext } from 'react'

import type {
  AppUser,
  AvatarSelection,
  ChildProfile,
  CreatureCareAction,
  CreaturePurchaseResult,
  DailyLimits,
  GameSettings,
  GameState,
  MissionOutcome,
} from '@/types/models'

export interface CompleteMissionInput {
  levelId: string
  worldId: string
  subject: string
  score: number
  xpEarned: number
  coinsEarned: number
  explanation: string
}

export interface GameContextValue extends GameState {
  currentChildProfile: ChildProfile | null
  setCurrentUser: (user: AppUser | null) => void
  setCurrentChildProfile: (childId: string) => void
  addChildProfile: (profile: ChildProfile) => void
  updateChildProfile: (profile: ChildProfile) => void
  updateAvatar: (childId: string, avatarSeed: AvatarSelection) => void
  startMission: (levelId: string) => void
  completeMission: (input: CompleteMissionInput) => MissionOutcome
  addXP: (value: number) => void
  addCoins: (value: number) => void
  addStars: (value: number) => void
  buyItem: (itemId: string, price: number) => boolean
  buyCreature: (creatureId: string, priceStars: number) => CreaturePurchaseResult
  toggleCreaturePlacement: (creatureId: string) => void
  careForCreature: (creatureId: string, action: CreatureCareAction, rewardStars: number) => boolean
  toggleCreatureItem: (creatureId: string, itemId: string) => void
  updateSettings: (input: Partial<GameSettings>) => void
  updateDailyLimits: (input: Partial<DailyLimits>) => void
  resetProgress: () => void
}

export const GameContext = createContext<GameContextValue | null>(null)
