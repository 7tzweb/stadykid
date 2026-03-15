import { useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useGame } from '@/hooks/useGame'

export function SettingsScreen() {
  const navigate = useNavigate()
  const { resetProgress, settings, updateSettings } = useGame()
  const [isResetOpen, setIsResetOpen] = useState(false)

  return (
    <ScreenLayout
      actions={
        <Button onClick={() => navigate('/worlds')} variant="secondary">
          חזרה למפה
        </Button>
      }
      eyebrow="הגדרות"
      subtitle="מסך הגדרות עם כפתורים גדולים, בחירת שפה ואיפוס התקדמות עם אישור."
      title="הגדרות"
      tone="lilac"
    >
      <div className="grid gap-4">
        {[
          {
            label: 'צלילים',
            description: 'צלילי משחק ואפקטים קצרים',
            active: settings.soundEnabled,
            onToggle: () => updateSettings({ soundEnabled: !settings.soundEnabled }),
          },
          {
            label: 'מוזיקה',
            description: 'מוזיקת רקע נעימה בזמן משחק',
            active: settings.musicEnabled,
            onToggle: () => updateSettings({ musicEnabled: !settings.musicEnabled }),
          },
          {
            label: 'תגובה למגע',
            description: 'הדגשה קלה של לחיצות למגע',
            active: settings.touchFeedback,
            onToggle: () => updateSettings({ touchFeedback: !settings.touchFeedback }),
          },
        ].map((toggle) => (
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" key={toggle.label}>
            <div>
              <h2 className="font-display text-2xl text-slate-900">{toggle.label}</h2>
              <p className="text-slate-500">{toggle.description}</p>
            </div>
            <Button onClick={toggle.onToggle} variant={toggle.active ? 'primary' : 'secondary'}>
              {toggle.active ? 'פועל' : 'כבוי'}
            </Button>
          </Card>
        ))}

        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-slate-900">שפה</h2>
            <p className="text-slate-500">הממשק מוצג בעברית. המבנה מוכן גם לתמיכה בשפות נוספות בהמשך.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => updateSettings({ language: 'he' })} variant="primary">
              עברית
            </Button>
            <Button disabled variant="secondary">
              אנגלית בהמשך
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-slate-900">איפוס התקדמות</h2>
            <p className="text-slate-500">מאפס נקודות, מטבעות והשלמות שלבים. פרופילי הילדים נשארים.</p>
          </div>
          <Button onClick={() => setIsResetOpen(true)} variant="danger">
            <RefreshCcw className="h-5 w-5" />
            מאפסים
          </Button>
        </Card>

        <Button onClick={() => navigate('/system/status')} variant="secondary">
          למסך סטטוס מערכת
        </Button>
      </div>

      <Modal onClose={() => setIsResetOpen(false)} open={isResetOpen} title="איפוס התקדמות">
        <div className="space-y-4">
          <p className="text-slate-600">לאחר האישור כל ההתקדמות תתאפס ותישמר גם באחסון המקומי של המכשיר.</p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                resetProgress()
                setIsResetOpen(false)
                navigate('/worlds')
              }}
              variant="danger"
            >
              כן, לאפס
            </Button>
            <Button onClick={() => setIsResetOpen(false)} variant="secondary">
              ביטול
            </Button>
          </div>
        </div>
      </Modal>
    </ScreenLayout>
  )
}
