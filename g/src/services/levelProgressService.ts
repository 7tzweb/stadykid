import type { ExperienceMode, LevelTrack } from '@/types/models'

export interface StoredLevelProgress {
  levelId: string
  currentActivityIndex: number
  currentActivityMistakes: number
  activityScores: number[]
  earnedStars: number
  mistakeCount: number
  hintIndex: number
  totalActivityCount: number
}

const levelProgressStorageKeyPrefix = 'gamekids-level-progress-v2'

export function buildLevelProgressStorageKey(
  experienceMode: ExperienceMode,
  childProfileId: string | null | undefined,
  levelId: string,
  levelTrack: LevelTrack = 'standard',
) {
  return `${levelProgressStorageKeyPrefix}:${experienceMode}:${childProfileId ?? 'guest'}:${levelTrack}:${levelId}`
}

export function loadStoredLevelProgress(storageKey: string) {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(storageKey)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as StoredLevelProgress
  } catch {
    return null
  }
}

export function persistStoredLevelProgress(storageKey: string, progress: StoredLevelProgress) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(progress))
}

export function clearStoredLevelProgress(storageKey: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(storageKey)
}

export function resolveStoredLevelProgressPercent(
  progress: StoredLevelProgress | null,
  fallbackTotalActivityCount: number,
) {
  if (!progress) {
    return 0
  }

  const totalActivityCount = Math.max(1, progress.totalActivityCount || fallbackTotalActivityCount)
  const completedActivityCount = Math.min(progress.activityScores.length, totalActivityCount)

  return Math.round((completedActivityCount / totalActivityCount) * 100)
}
