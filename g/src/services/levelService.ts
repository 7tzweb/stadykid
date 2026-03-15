import { LevelValidationError, parseGameLevel } from '@/game/engine/level-parser'

export const levelManifest = [
  'forest-numbers-001',
  'forest-numbers-002',
  'castle-reading-001',
  'castle-reading-002',
  'space-english-001',
  'space-english-002',
  'logic-cave-001',
  'logic-cave-002',
  'memory-island-001',
  'memory-island-002',
] as const

export async function loadLevelDefinition(levelId: string) {
  const response = await fetch(`/levels/${levelId}.json`)
  const responseText = await response.text()
  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok) {
    throw new Error(`קובץ השלב ${levelId} לא נמצא.`)
  }

  if (!contentType.includes('application/json')) {
    throw new Error(
      `קובץ השלב ${levelId} לא חזר בפורמט JSON. בדקו אם הקובץ קיים בתיקיית levels.`,
    )
  }

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
