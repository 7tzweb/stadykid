import clsx from 'clsx'
import { useState } from 'react'

import { Card } from '@/components/ui/Card'
import type { MultipleChoiceActivity } from '@/game/engine/level-schema'
import type { MiniGameRendererProps } from '@/game/runtime/renderer-types'

export function MultipleChoiceGame({
  activity,
  onSuccess,
  onMistake,
  disabled,
}: MiniGameRendererProps<MultipleChoiceActivity>) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  function handleOptionSelect(optionId: string) {
    if (disabled || isCompleted) {
      return
    }

    setSelectedOptionId(optionId)

    if (optionId === activity.content.correctOptionId) {
      setIsCompleted(true)
      onSuccess({
        score: 100,
        explanation: activity.content.explanation,
      })
      return
    }

    onMistake('כמעט. נסתכל שוב על הקבוצות וננסה תשובה אחרת.')
  }

  return (
    <Card className="space-y-4 p-4 lg:p-5">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold tracking-[0.22em] text-slate-500">בחירה מתוך אפשרויות</p>
        <h3 className="font-display text-2xl text-slate-900 xl:text-3xl">{activity.content.prompt}</h3>
        <p className="text-base text-slate-600">{activity.content.question}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {activity.content.options.map((option) => {
          const isCorrect = option.id === activity.content.correctOptionId
          const isSelected = option.id === selectedOptionId

          return (
            <button
              className={clsx(
                'rounded-[24px] border px-4 py-4 text-right transition',
                isSelected && isCorrect && 'border-emerald-300 bg-emerald-50 text-emerald-900',
                isSelected && !isCorrect && 'border-rose-300 bg-rose-50 text-rose-900',
                !isSelected && 'border-slate-200 bg-white hover:border-[#f26a4b] hover:bg-[#fff7f2]',
              )}
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              type="button"
            >
              <div className="flex items-center gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                  {option.emoji ?? '⭐'}
                </div>
                <div>
                  <p className="text-xl font-bold">{option.label}</p>
                  <p className="text-xs text-slate-500">לחיצה אחת לבחירה</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
