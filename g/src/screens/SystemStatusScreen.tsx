import { CheckCircle2, Database, Gamepad2, Smartphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { isFirebaseConfigured } from '@/firebase/config'
import { levelManifest } from '@/services/levelService'

export function SystemStatusScreen() {
  const navigate = useNavigate()

  return (
    <ScreenLayout
      actions={
        <Button onClick={() => navigate('/settings')} variant="secondary">
          חזרה להגדרות
        </Button>
      }
      eyebrow="סטטוס"
      subtitle="מסך תחזוקה שמרכז את מצב ה-Firebase, מנוע השלבים, Capacitor ומספר קבצי ה-JSON."
      title="סטטוס המערכת"
      tone="sky"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Firebase',
            value: isFirebaseConfigured ? 'מוגדר' : 'מצב דמו',
            icon: <Database className="h-8 w-8" />,
          },
          {
            title: 'שלבי JSON',
            value: `${levelManifest.length} קבצים`,
            icon: <CheckCircle2 className="h-8 w-8" />,
          },
          {
            title: 'מנוע משחק',
            value: 'Phaser והרצה דינמית',
            icon: <Gamepad2 className="h-8 w-8" />,
          },
          {
            title: 'Capacitor',
            value: 'מוכן להגדרה',
            icon: <Smartphone className="h-8 w-8" />,
          },
        ].map((item) => (
          <Card className="space-y-4" key={item.title}>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#eff6ff] text-[#2563eb]">
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">{item.title}</p>
              <p className="mt-2 font-display text-3xl text-slate-900">{item.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </ScreenLayout>
  )
}
