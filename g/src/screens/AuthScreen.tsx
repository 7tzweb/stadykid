import { startTransition, useState } from 'react'
import { ArrowLeft, Cloud, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StepGuide } from '@/components/ui/StepGuide'
import { isFirebaseConfigured } from '@/firebase/config'
import { useGame } from '@/hooks/useGame'
import { signInWithGoogle } from '@/services/authService'

export function AuthScreen() {
  const navigate = useNavigate()
  const { currentUser, setCurrentUser } = useGame()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSignIn() {
    setIsLoading(true)
    setMessage(null)

    try {
      const user = await signInWithGoogle()
      setCurrentUser(user)

      startTransition(() => {
        navigate('/profiles')
      })
    } catch {
      setMessage('החיבור לא הושלם. אפשר לנסות שוב או להמשיך עם דמו.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScreenLayout
      eyebrow="התחברות"
      subtitle="מסך כניסה פשוט. אפשר להתחבר עם חשבון או להמשיך מיד למצב דמו."
      title="כניסה מהירה ובטוחה"
      tone="sky"
    >
      <div className="space-y-6">
        <StepGuide
          accent="#2563eb"
          items={[
            {
              title: 'מתחברים',
              description: 'אפשר עם חשבון Google או בלי חשבון.',
            },
            {
              title: 'ממשיכים לפרופילים',
              description: 'אחרי ההתחברות בוחרים ילד.',
            },
            {
              title: 'מתחילים לשחק',
              description: 'משם הדרך קצרה למפת העולמות.',
            },
          ]}
          title="מה קורה אחרי ההתחברות?"
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="space-y-5">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#dbeafe] text-[#2563eb]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-3xl text-slate-900">כניסה עם Google</h2>
              <p className="text-slate-600">
                אם יהיו מפתחות Firebase ב-`.env`, ההתחברות תעבוד מול Firebase Auth. בלי מפתחות,
                אפשר להמשיך עם משתמש דמו כדי לא לעצור את השימוש.
              </p>
            </div>
            <Button className="w-full" disabled={isLoading} onClick={handleSignIn}>
              {isLoading ? 'מתחבר...' : 'כניסה עם חשבון Google'}
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button onClick={() => navigate('/profiles')} variant="secondary">
              המשך עם דמו
            </Button>
            {message && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>}
            {currentUser && (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                כבר מחובר כעת: {currentUser.name}
              </p>
            )}
          </Card>

          <Card className="space-y-4 bg-[#f8fbff]">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-[#0ea5e9] shadow-sm">
              <Cloud className="h-8 w-8" />
            </div>
            <h2 className="font-display text-3xl text-slate-900">מצב תשתית</h2>
            <div className="space-y-3 text-sm text-slate-600">
              <p className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                Firebase: <strong>{isFirebaseConfigured ? 'מוגדר' : 'לא מוגדר, עובד בדמו'}</strong>
              </p>
              <p className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                Firestore: מוכן לשמירת התקדמות, פרופילים, נקודות ומידע לאזור הורים.
              </p>
              <p className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                Capacitor: מוגדר בסיסית כך שהאפליקציה יכולה להתרחב ל-Android/iOS בהמשך.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </ScreenLayout>
  )
}
