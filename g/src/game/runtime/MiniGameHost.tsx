import type { GameActivity } from '@/game/engine/level-schema'
import { DragAndDropGame } from '@/game/runtime/DragAndDropGame'
import { MatchPairsGame } from '@/game/runtime/MatchPairsGame'
import { MemoryCardsGame } from '@/game/runtime/MemoryCardsGame'
import { MultipleChoiceGame } from '@/game/runtime/MultipleChoiceGame'
import type { GameCompletion } from '@/game/runtime/renderer-types'

interface MiniGameHostProps {
  activity: GameActivity
  disabled?: boolean
  onSuccess: (completion: GameCompletion) => void
  onMistake: (message: string) => void
}

export function MiniGameHost({
  activity,
  disabled,
  onSuccess,
  onMistake,
}: MiniGameHostProps) {
  switch (activity.type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceGame
          activity={activity}
          disabled={disabled}
          onMistake={onMistake}
          onSuccess={onSuccess}
        />
      )

    case 'drag_and_drop':
      return (
        <DragAndDropGame
          activity={activity}
          disabled={disabled}
          onMistake={onMistake}
          onSuccess={onSuccess}
        />
      )

    case 'match_pairs':
      return (
        <MatchPairsGame disabled={disabled} activity={activity} onMistake={onMistake} onSuccess={onSuccess} />
      )

    case 'memory_cards':
      return (
        <MemoryCardsGame
          activity={activity}
          disabled={disabled}
          onMistake={onMistake}
          onSuccess={onSuccess}
        />
      )

    default:
      return null
  }
}
