import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { parentInsights, subjectLabels } from '@/game/content/catalog'
import { useGame } from '@/hooks/useGame'
import { signOutCurrentUser } from '@/services/authService'

export function ParentDashboardScreen() {
  const navigate = useNavigate()
  const { currentUser, dailyLimits, progressBySubject, setCurrentUser, updateDailyLimits } = useGame()

  const weakAreas = Object.entries(progressBySubject)
    .sort(([, first], [, second]) => first.accuracy - second.accuracy)
    .slice(0, 3)

  return (
    <ScreenLayout
      actions={
        <Button onClick={() => navigate('/worlds')} variant="secondary">
          חזרה לאפליקציה
        </Button>
      }
      eyebrow="אזור הורים"
      subtitle="דשבורד להורה עם גרפים פשוטים, שליטה בזמן מסך והפעלת נושאים."
      title="אזור הורים"
      tone="sky"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {parentInsights.map((insight) => (
            <Card className="space-y-3" key={insight.label}>
              <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">{insight.label}</p>
              <p className="font-display text-4xl text-slate-900">{insight.value}%</p>
              <div className="h-3 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${insight.value}%`,
                    background: insight.accent,
                  }}
                />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="space-y-4">
            <h2 className="font-display text-3xl text-slate-900">התקדמות לפי נושאים</h2>
            <div className="space-y-4">
              {Object.entries(progressBySubject).map(([subject, progress]) => (
                <div className="space-y-2" key={subject}>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                    <span>{subjectLabels[subject] ?? subject}</span>
                    <span>{progress.accuracy}% דיוק</span>
                  </div>
                  <div className="h-4 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#14b8a6]"
                      style={{ width: `${progress.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="space-y-2">
              <h2 className="font-display text-3xl text-slate-900">מרכז בקרה</h2>
              <p className="text-sm text-slate-500">{currentUser?.email ?? 'דמו ללא אימות אמיתי'}</p>
            </div>

            <div className="rounded-[24px] bg-[#f8fafc] px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">מגבלת זמן יומית</p>
                  <p className="text-sm text-slate-500">{dailyLimits.minutes} דקות</p>
                </div>
                <Button
                  onClick={() => updateDailyLimits({ enabled: !dailyLimits.enabled })}
                  size="md"
                  variant={dailyLimits.enabled ? 'primary' : 'secondary'}
                >
                  {dailyLimits.enabled ? 'פעיל' : 'כבוי'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-slate-900">הפעלת נושאים</p>
              {Object.keys(progressBySubject).map((subject) => {
                const enabled = dailyLimits.enabledSubjects.includes(subject)

                return (
                  <button
                    className={`flex w-full items-center justify-between rounded-[24px] px-4 py-4 text-right ${
                      enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                    key={subject}
                    onClick={() =>
                      updateDailyLimits({
                        enabledSubjects: enabled
                          ? dailyLimits.enabledSubjects.filter((entry) => entry !== subject)
                          : [...dailyLimits.enabledSubjects, subject],
                      })
                    }
                    type="button"
                  >
                    <span className="font-semibold">{subjectLabels[subject] ?? subject}</span>
                    <span>{enabled ? 'פעיל' : 'כבוי'}</span>
                  </button>
                )
              })}
            </div>

            <div className="rounded-[24px] bg-[#fff7ed] px-4 py-4">
              <p className="font-bold text-slate-900">נושאים שדורשים חיזוק</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {weakAreas.map(([subject, progress]) => (
                  <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700" key={subject}>
                    {subjectLabels[subject] ?? subject}: {progress.accuracy}%
                  </span>
                ))}
              </div>
            </div>

            <Button
              onClick={async () => {
                await signOutCurrentUser()
                setCurrentUser(null)
                navigate('/')
              }}
              variant="danger"
            >
              יציאה מהחשבון
            </Button>
          </Card>
        </div>
      </div>
    </ScreenLayout>
  )
}
