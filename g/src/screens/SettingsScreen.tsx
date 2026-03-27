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
      eyebrow="הַגְדָּרוֹת"
      subtitle="מסך הַגְדָּרוֹת עם כפתורים גדולים, בחירת שפה ואיפוס הִתְקַדְּמוּת עם אישור."
      title="הַגְדָּרוֹת"
      tone="lilac"
    >
      <div className="grid gap-4">
        {[
          {
            label: 'צְלִילִים',
            description: 'צְלִילֵי מִשְׂחָק וְאֶפֶקְטִים קְצָרִים',
            active: settings.soundEnabled,
            onToggle: () => updateSettings({ soundEnabled: !settings.soundEnabled }),
          },
          {
            label: 'מוּזִיקָה',
            description: 'מוּזִיקַת רֶקַע נְעִימָה בִּזְמַן מִשְׂחָק',
            active: settings.musicEnabled,
            onToggle: () => updateSettings({ musicEnabled: !settings.musicEnabled }),
          },
          {
            label: 'תְּגוּבָה לְמַגָּע',
            description: 'הַדְגָּשָׁה קַלָּה שֶׁל לְחִיצוֹת לְמַגָּע',
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
              {toggle.active ? 'פּוֹעַל' : 'כָּבוּי'}
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
              אַנְגְּלִית בהמשך
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-slate-900">איפוס הִתְקַדְּמוּת</h2>
            <p className="text-slate-500">מאפס נקודות, מטבעות והשלמות שלבים. פרופילי הילדים נשארים.</p>
          </div>
          <Button onClick={() => setIsResetOpen(true)} variant="danger">
            <RefreshCcw className="h-5 w-5" />
            מאפסים
          </Button>
        </Card>

        <Button onClick={() => navigate('/system/status')} variant="secondary">
          למסך סְטָטוּס מערכת
        </Button>
      </div>

      <Modal onClose={() => setIsResetOpen(false)} open={isResetOpen} title="איפוס הִתְקַדְּמוּת">
        <div className="space-y-4">
          <p className="text-slate-600">לאחר האישור כל ההִתְקַדְּמוּת תתאפס ותישמר גם באחסון המקומי של המכשיר.</p>
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
