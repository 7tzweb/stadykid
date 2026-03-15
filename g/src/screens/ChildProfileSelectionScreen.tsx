import { Plus, Sparkles, UserRoundPen } from 'lucide-react'
import { startTransition } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StepGuide } from '@/components/ui/StepGuide'
import { useGame } from '@/hooks/useGame'

export function ChildProfileSelectionScreen() {
  const navigate = useNavigate()
  const { childProfiles, currentUser, setCurrentChildProfile } = useGame()

  return (
    <ScreenLayout
      eyebrow="בחירת ילדים"
      subtitle="לוחצים על הכרטיס עם השם שלכם ואז ממשיכים ישר לבית הראשי של הגורים."
      title="מי יוצא להרפתקה עכשיו?"
      tone="mint"
      actions={
        <div className="rounded-full bg-white/75 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
          {currentUser ? `מחובר: ${currentUser.name}` : 'מצב דמו'}
        </div>
      }
    >
      <div className="space-y-6">
        <StepGuide
          accent="#14b8a6"
          items={[
            {
              title: 'מחפשים את השם',
              description: 'כל ילד בוחר את הכרטיס שלו.',
            },
            {
              title: 'לוחצים על הכפתור הגדול',
              description: 'הכפתור הכתום מתחיל את המשחק.',
            },
            {
              title: 'מגיעים לבית הראשי',
              description: 'משם עוברים לחדרים, לחנות או לעולם השאלות.',
            },
          ]}
          title="כך מתחילים מכאן"
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {childProfiles.map((profile) => (
            <Card className="space-y-4" key={profile.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="inline-flex h-20 w-20 items-center justify-center rounded-full text-3xl shadow-inner"
                    style={{
                      background: `linear-gradient(180deg, ${profile.avatarSeed.bodyColor} 0%, #ffffff 100%)`,
                    }}
                  >
                    ✨
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
                    <p className="text-sm text-slate-500">
                      גיל {profile.age} · אוהב/ת {profile.favoriteSubject}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#fff4e8] px-3 py-2 text-sm font-bold text-[#f26a4b]">
                  רמה {profile.level}
                </span>
              </div>

              <div className="rounded-[24px] bg-[#f8fafc] p-4 text-sm text-slate-600">
                חיית מחמד: <strong>{profile.petName}</strong>
                <br />
                שלבים שהושלמו: <strong>{profile.completedLevelIds.length}</strong>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setCurrentChildProfile(profile.id)
                    startTransition(() => {
                      navigate('/home')
                    })
                  }}
                >
                  זה אני, מתחילים
                  <Sparkles className="h-5 w-5" />
                </Button>
                <Button onClick={() => navigate(`/profiles/${profile.id}/edit`)} variant="secondary">
                  עריכה
                  <UserRoundPen className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          ))}

          <Card className="flex min-h-[320px] flex-col items-center justify-center gap-4 border-dashed bg-white/55 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#14b8a6] shadow-sm">
              <Plus className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-3xl text-slate-900">להוסיף ילד חדש</h2>
              <p className="text-slate-500">יוצרים פרופיל, בוחרים אווטאר ומתחילים מסלול חדש.</p>
            </div>
            <Button onClick={() => navigate('/profiles/new')}>יוצרים ילד חדש</Button>
          </Card>
        </div>
      </div>
    </ScreenLayout>
  )
}
