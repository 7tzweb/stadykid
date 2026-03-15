import clsx from 'clsx'
import { useState } from 'react'

import { Card } from '@/components/ui/Card'
import type { MemoryCardsLevel } from '@/game/engine/level-schema'
import type { MiniGameRendererProps } from '@/game/runtime/renderer-types'
import { shuffleItems } from '@/game/runtime/utils'

interface DeckCard {
  id: string
  pairId: string
  label: string
  emoji: string
}

function createDeck(level: MemoryCardsLevel): DeckCard[] {
  return shuffleItems(
    level.content.pairs.flatMap((pair) => [
      {
        id: `${pair.id}-a`,
        pairId: pair.id,
        label: pair.label,
        emoji: pair.emoji ?? '✨',
      },
      {
        id: `${pair.id}-b`,
        pairId: pair.id,
        label: pair.label,
        emoji: pair.emoji ?? '✨',
      },
    ]),
  )
}

export function MemoryCardsGame({
  level,
  onSuccess,
  onMistake,
  disabled,
}: MiniGameRendererProps<MemoryCardsLevel>) {
  const [deck] = useState(() => createDeck(level))
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([])
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([])
  const [hasCompleted, setHasCompleted] = useState(false)

  function handleCardClick(card: DeckCard) {
    if (
      disabled ||
      hasCompleted ||
      matchedPairIds.includes(card.pairId) ||
      flippedCardIds.includes(card.id) ||
      flippedCardIds.length === 2
    ) {
      return
    }

    if (flippedCardIds.length === 0) {
      setFlippedCardIds([card.id])
      return
    }

    const firstCard = deck.find((entry) => entry.id === flippedCardIds[0])

    if (!firstCard) {
      setFlippedCardIds([card.id])
      return
    }

    if (firstCard.pairId === card.pairId) {
      const nextMatchedPairIds = matchedPairIds.includes(card.pairId)
        ? matchedPairIds
        : [...matchedPairIds, card.pairId]

      setMatchedPairIds(nextMatchedPairIds)
      setFlippedCardIds([])

      if (!hasCompleted && nextMatchedPairIds.length === level.content.pairs.length) {
        setHasCompleted(true)
        onSuccess({
          score: 100,
          explanation: level.content.explanation,
        })
      }

      return
    }

    setFlippedCardIds([flippedCardIds[0], card.id])
    onMistake('הקלפים לא תואמים. זוכרים איפה הם היו ומנסים שוב.')

    window.setTimeout(() => {
      setFlippedCardIds([])
    }, 750)
  }

  return (
    <Card className="space-y-4 p-4 lg:p-5">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold tracking-[0.22em] text-slate-500">קלפי זיכרון</p>
        <h3 className="font-display text-2xl text-slate-900 xl:text-3xl">{level.content.prompt}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {deck.map((card) => {
          const isMatched = matchedPairIds.includes(card.pairId)
          const isFlipped = flippedCardIds.includes(card.id)

          return (
            <button
              className={clsx(
                'aspect-square rounded-[28px] border transition',
                isMatched && 'border-emerald-300 bg-emerald-50 text-emerald-900',
                !isMatched && isFlipped && 'border-[#0ea5e9] bg-[#f0f9ff] text-sky-900',
                !isMatched && !isFlipped && 'border-slate-200 bg-white hover:border-[#0ea5e9]',
              )}
              disabled={disabled || isMatched || flippedCardIds.length === 2}
              key={card.id}
              onClick={() => handleCardClick(card)}
              type="button"
            >
              {isMatched || isFlipped ? (
                <div className="space-y-2">
                  <div className="text-3xl">{card.emoji}</div>
                  <p className="text-xs font-bold">{card.label}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl">❔</div>
                  <p className="text-xs font-semibold text-slate-500">פתח קלף</p>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
