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
    <Card className="space-y-4 p-4 lg:p-5">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold tracking-[0.22em] text-slate-500">גרירה והתאמה</p>
        <h3 className="font-display text-2xl text-slate-900 xl:text-3xl">{activity.content.prompt}</h3>
        <p className="text-sm text-slate-600">אפשר לגרור עם עכבר, או ללחוץ על פריט ואז על יעד במסך מגע.</p>
      </div>

      <div className="grid gap-3 rounded-[28px] bg-[#fff7f1] p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {activity.content.items.map((item) => {
            const isPlaced = placedItemIds.has(item.id)

            return (
              <button
                className={clsx(
                  'rounded-[22px] border bg-white px-4 py-3 text-right shadow-sm transition',
                  activeItemId === item.id && 'border-[#14b8a6] bg-[#ecfeff]',
                  isPlaced && 'border-emerald-200 bg-emerald-50 text-emerald-900',
                  !activeItemId && !isPlaced && 'border-slate-200 hover:border-[#14b8a6]',
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
                <p className="text-base font-bold">{item.label}</p>
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
                className="rounded-[24px] border-2 border-dashed border-slate-300 bg-white/70 p-3"
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
                <h4 className="mt-1 text-lg font-bold text-slate-900">{target.label}</h4>
                <div className="mt-3 rounded-[20px] bg-[#f8fafc] p-3 text-center">
                  {assignedItem ? (
                    <div className="space-y-1">
                      <p className="text-base font-bold text-emerald-900">{assignedItem.label}</p>
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
