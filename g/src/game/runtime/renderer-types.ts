import type { GameActivity } from '@/game/engine/level-schema'

export interface GameCompletion {
  score: number
  explanation: string
}

export interface MiniGameRendererProps<TActivity extends GameActivity = GameActivity> {
  activity: TActivity
  disabled?: boolean
  onSuccess: (completion: GameCompletion) => void
  onMistake: (message: string) => void
}
