import clsx from 'clsx'
import { useState } from 'react'

import { Card } from '@/components/ui/Card'
import type { MultipleChoiceActivity } from '@/game/engine/level-schema'
import type { MiniGameRendererProps } from '@/game/runtime/renderer-types'

type MultipleChoiceOption = MultipleChoiceActivity['content']['options'][number]

function shuffleOptions(options: MultipleChoiceOption[]) {
  const shuffled = [...options]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]

    shuffled[index] = shuffled[randomIndex]!
    shuffled[randomIndex] = current!
  }

  return shuffled
}

function buildRandomizedOptions(activity: MultipleChoiceActivity) {
  const correctOption = activity.content.options.find((option) => option.id === activity.content.correctOptionId)

  if (!correctOption) {
    return shuffleOptions(activity.content.options)
  }

  const wrongOptions = shuffleOptions(activity.content.options.filter((option) => option.id !== correctOption.id))
  const correctOptionIndex = Math.floor(Math.random() * activity.content.options.length)

  wrongOptions.splice(correctOptionIndex, 0, correctOption)
  return wrongOptions
}

export function MultipleChoiceGame({
  activity,
  onSuccess,
  onMistake,
  disabled,
}: MiniGameRendererProps<MultipleChoiceActivity>) {
  const [shuffledOptions] = useState(() => buildRandomizedOptions(activity))
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
    <Card className="overflow-hidden border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,246,238,0.98))] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] lg:p-5">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd8c2] bg-[#fff7f2] px-4 py-2 text-sm font-bold text-[#ea580c]">
          <span className="text-base">🎯</span>
          תחנת בחירה
        </div>
        <h3 className="font-display text-2xl text-slate-900 xl:text-3xl">{activity.content.prompt}</h3>
        <p className="text-base font-medium text-slate-600">{activity.content.question}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {shuffledOptions.map((option) => {
          const isCorrect = option.id === activity.content.correctOptionId
          const isSelected = option.id === selectedOptionId

          return (
            <button
              className={clsx(
                'relative overflow-hidden rounded-[28px] border px-4 py-4 text-right shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition',
                isSelected && isCorrect && 'border-emerald-300 bg-emerald-50 text-emerald-900',
                isSelected && !isCorrect && 'border-rose-300 bg-rose-50 text-rose-900',
                !isSelected &&
                  'border-white/80 bg-white/90 hover:-translate-y-0.5 hover:border-[#f26a4b] hover:bg-[#fff7f2]',
              )}
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              type="button"
            >
              <div className="pointer-events-none absolute -left-4 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-[#fff2e8] blur-2xl" />
              <div className="flex items-center gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#fff5ee] text-2xl shadow-inner">
                  {option.emoji ?? '⭐'}
                </div>
                <div className="relative">
                  <p className="text-xl font-black">{option.label}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {isSelected && isCorrect
                      ? 'בדיוק זה'
                      : isSelected && !isCorrect
                        ? 'ננסה עוד פעם'
                        : 'בוחרים וממשיכים'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
