import type { LevelType } from '@/game/engine/level-schema'

export const levelTypeRegistry: Record<
  LevelType,
  { label: string; icon: string; accentColor: string }
> = {
  multiple_choice: {
    label: 'בחירה מרובה',
    icon: '✨',
    accentColor: '#F97316',
  },
  drag_and_drop: {
    label: 'גרירה ושחרור',
    icon: '🧩',
    accentColor: '#14B8A6',
  },
  match_pairs: {
    label: 'התאמת זוגות',
    icon: '🔗',
    accentColor: '#8B5CF6',
  },
  memory_cards: {
    label: 'כרטיסי זִיכָּרוֹן',
    icon: '🃏',
    accentColor: '#0EA5E9',
  },
}

export function getLevelTypeMeta(type: LevelType) {
  return levelTypeRegistry[type]
}
