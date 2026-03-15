import type { GameLevel } from '@/game/engine/level-schema'

export interface GameCompletion {
  score: number
  explanation: string
}

export interface MiniGameRendererProps<TLevel extends GameLevel = GameLevel> {
  level: TLevel
  disabled?: boolean
  onSuccess: (completion: GameCompletion) => void
  onMistake: (message: string) => void
}
