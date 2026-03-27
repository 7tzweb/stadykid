import clsx from 'clsx'
import { useState } from 'react'

import { Card } from '@/components/ui/Card'
import type { MatchPairsActivity } from '@/game/engine/level-schema'
import type { MiniGameRendererProps } from '@/game/runtime/renderer-types'
import { shuffleItems } from '@/game/runtime/utils'

export function MatchPairsGame({
  activity,
  onSuccess,
  onMistake,
  disabled,
}: MiniGameRendererProps<MatchPairsActivity>) {
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null)
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null)
  const [matchedIds, setMatchedIds] = useState<string[]>([])
  const [hasCompleted, setHasCompleted] = useState(false)
  const [shuffledPairs] = useState(() =>
    shuffleItems(activity.content.pairs.map((pair) => ({ id: pair.id, right: pair.right }))),
  )

  function resolveSelection(nextLeftId: string | null, nextRightId: string | null) {
    if (!nextLeftId || !nextRightId) {
      return
    }

    if (nextLeftId === nextRightId) {
      const nextMatchedIds = matchedIds.includes(nextLeftId)
        ? matchedIds
        : [...matchedIds, nextLeftId]

      setMatchedIds(nextMatchedIds)
      setSelectedLeftId(null)
      setSelectedRightId(null)

      if (!hasCompleted && nextMatchedIds.length === activity.content.pairs.length) {
        setHasCompleted(true)
        onSuccess({
          score: 100,
          explanation: activity.content.explanation,
        })
      }

      return
    }

    onMistake('זה לא זוג מתאים. אפשר לנסות שוב מיד.')

    window.setTimeout(() => {
      setSelectedLeftId(null)
      setSelectedRightId(null)
    }, 260)
  }

  function handleLeftSelect(pairId: string) {
    if (disabled || matchedIds.includes(pairId)) {
      return
    }

    setSelectedLeftId(pairId)
    resolveSelection(pairId, selectedRightId)
  }

  function handleRightSelect(pairId: string) {
    if (disabled || matchedIds.includes(pairId)) {
      return
    }

    setSelectedRightId(pairId)
    resolveSelection(selectedLeftId, pairId)
  }

  return (
    <Card className="space-y-4 p-4 lg:p-5">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold tracking-[0.22em] text-slate-500">התאמת זוגות</p>
        <h3 className="font-display text-2xl text-slate-900 xl:text-3xl">{activity.content.prompt}</h3>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          {activity.content.pairs.map((pair) => {
            const isMatched = matchedIds.includes(pair.id)

            return (
              <button
                className={clsx(
                  'w-full rounded-[22px] border px-4 py-3 text-right transition',
                  isMatched && 'border-emerald-300 bg-emerald-50 text-emerald-900',
                  selectedLeftId === pair.id && !isMatched && 'border-[#8b5cf6] bg-[#f5f3ff]',
                  !isMatched && selectedLeftId !== pair.id && 'border-slate-200 bg-white hover:border-[#8b5cf6]',
                )}
                disabled={disabled || isMatched}
                key={pair.id}
                onClick={() => handleLeftSelect(pair.id)}
                type="button"
              >
                <p className="text-base font-bold">{pair.left}</p>
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          {shuffledPairs.map((pair) => {
            const isMatched = matchedIds.includes(pair.id)

            return (
              <button
                className={clsx(
                  'w-full rounded-[22px] border px-4 py-3 text-right transition',
                  isMatched && 'border-emerald-300 bg-emerald-50 text-emerald-900',
                  selectedRightId === pair.id && !isMatched && 'border-[#8b5cf6] bg-[#f5f3ff]',
                  !isMatched &&
                    selectedRightId !== pair.id &&
                    'border-slate-200 bg-white hover:border-[#8b5cf6]',
                )}
                disabled={disabled || isMatched}
                key={pair.id}
                onClick={() => handleRightSelect(pair.id)}
                type="button"
              >
                <p className="text-base font-bold">{pair.right}</p>
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
