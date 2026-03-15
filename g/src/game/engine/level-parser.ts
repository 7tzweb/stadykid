import { gameLevelSchema, type GameLevel } from '@/game/engine/level-schema'

export class LevelValidationError extends Error {
  issues: string[]

  constructor(issues: string[]) {
    super('קובץ השלב לא תקין')
    this.name = 'LevelValidationError'
    this.issues = issues
  }
}

export function parseGameLevel(rawValue: unknown): GameLevel {
  const result = gameLevelSchema.safeParse(rawValue)

  if (!result.success) {
    throw new LevelValidationError(
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    )
  }

  return result.data
}
