import clsx from 'clsx'
import { useState } from 'react'

import { Card } from '@/components/ui/Card'
import type { DragAndDropActivity } from '@/game/engine/level-schema'
import type { MiniGameRendererProps } from '@/game/runtime/renderer-types'

export function DragAndDropGame({
  activity,
  onSuccess,
  onMistake,
  disabled,
}: MiniGameRendererProps<DragAndDropActivity>) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [isCompleted, setIsCompleted] = useState(false)

  function assignItem(targetId: string, itemId: string) {
    const target = activity.content.targets.find((entry) => entry.id === targetId)

    if (!target) {
      return
    }

    if (!target.accepts.includes(itemId)) {
      onMistake('זה לא היעד המתאים. נסה לגרור למקום אחר.')
      return
    }

    const nextPlacements = {
      ...placements,
      [targetId]: itemId,
    }

    setPlacements(nextPlacements)
    setActiveItemId(null)

    const solved = activity.content.targets.every((entry) => {
      const placedItemId = nextPlacements[entry.id]
      return Boolean(placedItemId) && entry.accepts.includes(placedItemId)
    })

    if (!solved || isCompleted) {
      return
    }

    setIsCompleted(true)
    onSuccess({
      score: 100,
      explanation: activity.content.explanation,
    })
  }

  const placedItemIds = new Set(Object.values(placements))

  return (
    <Card className="overflow-hidden border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(239,246,255,0.98))] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] lg:p-5">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-bold text-[#2563eb]">
          <span className="text-base">🧩</span>
          תחנת גרירה
        </div>
        <h3 className="font-display text-2xl text-slate-900 xl:text-3xl">{activity.content.prompt}</h3>
        <p className="text-sm font-medium text-slate-600">אפשר לגרור עם עכבר, או ללחוץ על פריט ואז על יעד במסך מגע.</p>
      </div>

      <div className="grid gap-3 rounded-[32px] bg-[linear-gradient(180deg,rgba(239,246,255,0.9),rgba(255,255,255,0.82))] p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {activity.content.items.map((item) => {
            const isPlaced = placedItemIds.has(item.id)

            return (
              <button
                className={clsx(
                  'rounded-[24px] border bg-white/94 px-4 py-3 text-right shadow-[0_12px_24px_rgba(15,23,42,0.05)] transition',
                  activeItemId === item.id && 'border-[#14b8a6] bg-[#ecfeff]',
                  isPlaced && 'border-emerald-200 bg-emerald-50 text-emerald-900',
                  !activeItemId && !isPlaced && 'border-white/80 hover:-translate-y-0.5 hover:border-[#14b8a6]',
                )}
                disabled={disabled || isPlaced}
                draggable={!disabled && !isPlaced}
                key={item.id}
                onClick={() => setActiveItemId(item.id)}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', item.id)
                }}
                type="button"
              >
                <p className="text-base font-black">{item.label}</p>
                <p className="text-xs text-slate-500">{isPlaced ? 'שובץ בהצלחה' : 'גרור או בחר'}</p>
              </button>
            )
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {activity.content.targets.map((target) => {
            const assignedItem = activity.content.items.find((item) => item.id === placements[target.id])

            return (
              <div
                className="rounded-[26px] border-2 border-dashed border-sky-200 bg-white/80 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                key={target.id}
                onClick={() => {
                  if (activeItemId) {
                    assignItem(target.id, activeItemId)
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const itemId = event.dataTransfer.getData('text/plain')
                  if (itemId) {
                    assignItem(target.id, itemId)
                  }
                }}
              >
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">יעד</p>
                <h4 className="mt-1 text-lg font-black text-slate-900">{target.label}</h4>
                <div className="mt-3 rounded-[22px] bg-[#f8fbff] p-3 text-center">
                  {assignedItem ? (
                    <div className="space-y-1">
                      <p className="text-base font-black text-emerald-900">{assignedItem.label}</p>
                      <p className="text-xs text-emerald-700">הוצב במקום הנכון</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">שחרר כאן את הפריט המתאים</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
