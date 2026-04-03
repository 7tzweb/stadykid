import { getMissionByLevelId, missionCatalog } from '@/game/content/catalog'
import { LevelValidationError, parseGameLevel } from '@/game/engine/level-parser'
import type { LevelTrack } from '@/types/models'

export const supportedLevelAges = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const

const defaultLevelAge = 6
const baseLevelManifest = missionCatalog.map((mission) => mission.levelId)

function parseLevelResponse(levelId: string, responseText: string) {
  try {
    const rawValue = JSON.parse(responseText) as unknown
    return parseGameLevel(rawValue)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`קובץ השלב ${levelId} מכיל JSON לא תקין.`)
    }

    if (error instanceof LevelValidationError) {
      const firstIssue = error.issues[0]

      throw new Error(firstIssue ? `קובץ השלב ${levelId} לא תקין: ${firstIssue}` : error.message)
    }

    throw error
  }
}

export function resolveLevelAgeBucket(age: number | undefined) {
  if (!Number.isFinite(age)) {
    return defaultLevelAge
  }

  const exactMatch = supportedLevelAges.find((supportedAge) => supportedAge === age)

  if (exactMatch) {
    return exactMatch
  }

  const lowerAge = [...supportedLevelAges].reverse().find((supportedAge) => supportedAge < Number(age))
  const upperAge = supportedLevelAges.find((supportedAge) => supportedAge > Number(age))

  if (!lowerAge) {
    return supportedLevelAges[0]
  }

  if (!upperAge) {
    return supportedLevelAges[supportedLevelAges.length - 1]
  }

  return Number(age) - lowerAge <= upperAge - Number(age) ? lowerAge : upperAge
}

function buildAgeLevelPath(levelId: string, age: number) {
  const mission = getMissionByLevelId(levelId)

  if (!mission) {
    return `/levels/${levelId}.json`
  }

  return `/levels/ages/${age}/${mission.worldId}/${levelId}.json`
}

function buildAdvancedAgeLevelPath(levelId: string, age: number) {
  const mission = getMissionByLevelId(levelId)

  if (!mission) {
    return `/levels/${levelId}.json`
  }

  return `/levels/advanced/${age}/${mission.worldId}/${levelId}.json`
}

export const levelManifest = [
  ...baseLevelManifest.map((levelId) => `/levels/${levelId}.json`),
  ...supportedLevelAges.flatMap((age) =>
    missionCatalog.map((mission) => buildAgeLevelPath(mission.levelId, age)),
  ),
  ...supportedLevelAges.flatMap((age) =>
    missionCatalog.map((mission) => buildAdvancedAgeLevelPath(mission.levelId, age)),
  ),
]

export async function loadLevelDefinition(levelId: string, age?: number, levelTrack: LevelTrack = 'standard') {
  const resolvedAge = resolveLevelAgeBucket(age)
  const candidatePaths = [
    levelTrack === 'advanced'
      ? buildAdvancedAgeLevelPath(levelId, resolvedAge)
      : buildAgeLevelPath(levelId, resolvedAge),
    buildAgeLevelPath(levelId, resolvedAge),
    `/levels/${levelId}.json`,
  ]

  for (const path of candidatePaths) {
    const response = await fetch(path)

    if (!response.ok) {
      continue
    }

    const responseText = await response.text()
    const contentType = response.headers.get('content-type') ?? ''

    if (!contentType.includes('application/json')) {
      throw new Error(
        `קובץ השלב ${levelId} לא חזר בפורמט JSON. בדקו אם הקובץ קיים בתיקיית levels.`,
      )
    }

    return parseLevelResponse(levelId, responseText)
  }

  throw new Error(`קובץ השלב ${levelId} לא נמצא.`)
}
