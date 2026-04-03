import { missionCatalog } from '@/game/content/catalog'
import type { ChildProfile, LevelTrack } from '@/types/models'

export const totalMissionStageCount = missionCatalog.length

export function getCompletedLevelIdsForTrack(
  childProfile: ChildProfile | null | undefined,
  levelTrack: LevelTrack,
) {
  if (!childProfile) {
    return []
  }

  return levelTrack === 'advanced'
    ? childProfile.advancedCompletedLevelIds ?? []
    : childProfile.completedLevelIds ?? []
}

export function isAdvancedTrackUnlocked(childProfile: ChildProfile | null | undefined) {
  return getCompletedLevelIdsForTrack(childProfile, 'standard').length >= totalMissionStageCount
}

export function getResolvedActiveLevelTrack(childProfile: ChildProfile | null | undefined): LevelTrack {
  if (!childProfile) {
    return 'standard'
  }

  if (
    isAdvancedTrackUnlocked(childProfile) &&
    (childProfile.activeLevelTrack === 'advanced' ||
      (childProfile.advancedCompletedLevelIds?.length ?? 0) > 0 ||
      childProfile.completedLevelIds.length >= totalMissionStageCount)
  ) {
    return 'advanced'
  }

  return 'standard'
}

export function getLevelTrackLabel(levelTrack: LevelTrack) {
  return levelTrack === 'advanced' ? 'סבב מתקדם' : 'סבב רגיל'
}

export function getChallengeAgeForTrack(age: number | undefined, levelTrack: LevelTrack) {
  if (!Number.isFinite(age)) {
    return levelTrack === 'advanced' ? 7 : 5
  }

  const normalizedAge = Number(age)

  if (levelTrack === 'advanced') {
    return Math.min(13, normalizedAge + 1)
  }

  return Math.max(3, normalizedAge - 1)
}
