import type { GameLevel } from '@/game/engine/level-schema'
import { DragAndDropGame } from '@/game/runtime/DragAndDropGame'
import { MatchPairsGame } from '@/game/runtime/MatchPairsGame'
import { MemoryCardsGame } from '@/game/runtime/MemoryCardsGame'
import { MultipleChoiceGame } from '@/game/runtime/MultipleChoiceGame'
import type { GameCompletion } from '@/game/runtime/renderer-types'

interface MiniGameHostProps {
  level: GameLevel
  disabled?: boolean
  onSuccess: (completion: GameCompletion) => void
  onMistake: (message: string) => void
}

export function MiniGameHost({
  level,
  disabled,
  onSuccess,
  onMistake,
}: MiniGameHostProps) {
  switch (level.type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceGame
          disabled={disabled}
          level={level}
          onMistake={onMistake}
          onSuccess={onSuccess}
        />
      )

    case 'drag_and_drop':
      return (
        <DragAndDropGame
          disabled={disabled}
          level={level}
          onMistake={onMistake}
          onSuccess={onSuccess}
        />
      )

    case 'match_pairs':
      return (
        <MatchPairsGame disabled={disabled} level={level} onMistake={onMistake} onSuccess={onSuccess} />
      )

    case 'memory_cards':
      return (
        <MemoryCardsGame
          disabled={disabled}
          level={level}
          onMistake={onMistake}
          onSuccess={onSuccess}
        />
      )

    default:
      return null
  }
}
