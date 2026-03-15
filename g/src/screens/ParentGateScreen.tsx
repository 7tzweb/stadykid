import { useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function ParentGateScreen() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <ScreenLayout
      eyebrow="שער הורים"
      subtitle="שכבת הגנה פשוטה לפני מעבר לאזור הורים. קוד הדמו כרגע הוא 2468."
      title="אימות הורה"
      tone="lilac"
    >
      <Card className="mx-auto mt-10 max-w-xl space-y-5 text-center">
        <div className="mx-auto inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#ede9fe] text-[#8b5cf6]">
          <LockKeyhole className="h-8 w-8" />
        </div>
        <p className="text-slate-600">הכניסו קוד הורה כדי להמשיך לאזור ההורים.</p>
        <input
          className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-center text-2xl tracking-[0.6em] outline-none focus:border-[#8b5cf6]"
          maxLength={4}
          onChange={(event) => setPin(event.target.value)}
          value={pin}
        />
        {error && <p className="rounded-[22px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => {
              if (pin === '2468') {
                navigate('/parent/dashboard')
                return
              }

              setError('הקוד לא נכון. בקובץ הדמו הקוד הוא 2468.')
            }}
          >
            כניסה לאזור הורים
          </Button>
          <Button onClick={() => navigate('/')} variant="secondary">
            חזרה
          </Button>
        </div>
      </Card>
    </ScreenLayout>
  )
}
