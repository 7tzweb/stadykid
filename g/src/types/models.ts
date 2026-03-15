export interface AppUser {
  id: string
  name: string
  email: string
  photoUrl?: string
}

export interface AvatarSelection {
  bodyColor: string
  hair: string
  eyes: string
  outfit: string
  pet: string
}

export interface ChildProfile {
  id: string
  name: string
  age: number
  avatarSeed: AvatarSelection
  level: number
  favoriteSubject: string
  petName: string
  completedLevelIds: string[]
  equippedItems: string[]
}

export interface MissionDefinition {
  id: string
  worldId: string
  levelId: string
  name: string
  description: string
  difficulty: 1 | 2 | 3
  subject: string
  icon: string
  isLocked: boolean
}

export interface WorldDefinition {
  id: string
  name: string
  subtitle: string
  description: string
  icon: string
  accentColor: string
  themeGradient: string
  subject: string
  missionIds: string[]
}

export type ShopCategory = 'Eggs' | 'Clothes' | 'Accessories'

export interface ShopItem {
  id: string
  category: Exclude<ShopCategory, 'Eggs'>
  name: string
  description: string
  price: number
  icon: string
  accent: string
}

export interface CreatureCareRequirements {
  feedCount: number
  petCount: number
  playCount: number
  restCount: number
}

export interface CreatureStageDefinition {
  id: string
  name: string
  image: string
  requiredLifetimeMinutes: number
  requiredCare: CreatureCareRequirements
}

export interface CreatureRewardDefinition {
  feed: number
  pet: number
  play: number
  rest: number
}

export interface CreatureNeedsDefinition {
  hungerIntervalMinutes: number
  pettingIntervalMinutes: number
  playIntervalMinutes: number
  restIntervalMinutes: number
  hungerIntervalSeconds?: number
  pettingIntervalSeconds?: number
  pettingRewardClicks: number
  feedingFillItems: number
  feedingRewardEveryCount: number
  rewardStars: CreatureRewardDefinition
}

export interface CreatureSoundDefinition {
  idleLabel: string
  happyLabel: string
  needyLabel: string
}

export interface CreatureDefinition {
  id: string
  name: string
  description: string
  priceStars: number
  accent: string
  eggImage: string
  cardImage: string
  hatchDurationMinutes: number
  favoriteFood: string
  favoriteGame: string
  personality: string
  sounds: CreatureSoundDefinition
  needs: CreatureNeedsDefinition
  stages: CreatureStageDefinition[]
}

export interface OwnedCreatureCareStats {
  feedCount: number
  petCount: number
  playCount: number
  restCount: number
}

export interface OwnedCreature {
  creatureId: string
  purchasedAt: string
  placedInHome: boolean
  lastFedAt: string | null
  lastPettedAt: string | null
  lastPlayedAt: string | null
  lastRestedAt: string | null
  lastSoundAt: string | null
  care: OwnedCreatureCareStats
  equippedItems: string[]
}

export type CreaturePurchaseResult = 'success' | 'owned' | 'insufficient-stars'
export type CreatureCareAction = 'feed' | 'pet' | 'play' | 'rest'

export interface SubjectProgress {
  completed: number
  total: number
  accuracy: number
}

export interface GameSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  language: 'he' | 'en'
  touchFeedback: boolean
}

export interface DailyLimits {
  enabled: boolean
  minutes: number
  enabledSubjects: string[]
}

export interface MissionOutcome {
  success: boolean
  levelId: string
  score: number
  xpEarned: number
  coinsEarned: number
  starsEarned: number
  explanation: string
}

export interface ParentInsight {
  label: string
  value: number
  accent: string
}

export interface AvatarCatalog {
  hair: string[]
  eyes: string[]
  clothes: string[]
  pets: string[]
}

export interface GameState {
  currentUser: AppUser | null
  childProfiles: ChildProfile[]
  currentChildProfileId: string | null
  xp: number
  coins: number
  stars: number
  unlockedWorlds: string[]
  progressBySubject: Record<string, SubjectProgress>
  settings: GameSettings
  inventory: string[]
  ownedCreatures: OwnedCreature[]
  currentLevelId: string | null
  hearts: number
  dailyLimits: DailyLimits
  lastMissionOutcome: MissionOutcome | null
}
