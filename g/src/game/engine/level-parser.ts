import {
  legacyGameLevelSchema,
  normalizeLegacyGameLevel,
  stageLevelSchema,
  type GameLevel,
} from '@/game/engine/level-schema'

export class LevelValidationError extends Error {
  issues: string[]

  constructor(issues: string[]) {
    super('קובץ השלב לא תקין')
    this.name = 'LevelValidationError'
    this.issues = issues
  }
}

export function parseGameLevel(rawValue: unknown): GameLevel {
  const stageResult = stageLevelSchema.safeParse(rawValue)

  if (stageResult.success) {
    return stageResult.data
  }

  const legacyResult = legacyGameLevelSchema.safeParse(rawValue)

  if (legacyResult.success) {
    return normalizeLegacyGameLevel(legacyResult.data)
  }

  throw new LevelValidationError(
    stageResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  )
}
