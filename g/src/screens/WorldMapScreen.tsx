import { BarChart3, Coins, House, Settings, ShoppingBag, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { missionCatalog, worldCatalog } from '@/game/content/catalog'
import { useGame } from '@/hooks/useGame'

const nodePositions: Record<string, string> = {
  'forest-of-numbers': 'right-[6%] top-[58%]',
  'castle-of-reading': 'right-[28%] top-[34%]',
  'space-english': 'right-[50%] top-[16%]',
  'logic-cave': 'left-[24%] top-[30%]',
  'memory-island': 'left-[8%] top-[56%]',
}

export function WorldMapScreen() {
  const navigate = useNavigate()
  const { coins, currentChildProfile, currentUser, stars, unlockedWorlds, xp } = useGame()

  return (
    <ScreenLayout
      title="מפת ההרפתקה"
      tone="sky"
      actions={
        <div className="flex flex-wrap gap-3">
          <Button
            className="px-7 text-base shadow-[0_18px_40px_rgba(242,106,75,0.24)]"
            onClick={() => navigate('/home')}
            size="lg"
            variant="primary"
          >
            <House className="h-5 w-5" />
            עולם הגורים
          </Button>
          <Button onClick={() => navigate('/progress')} size="md" variant="secondary">
            <BarChart3 className="h-5 w-5" />
            ההתקדמות שלי
          </Button>
          <Button onClick={() => navigate('/shop')} size="md" variant="secondary">
            <ShoppingBag className="h-5 w-5" />
            חנות
          </Button>
          <Button onClick={() => navigate('/settings')} size="md" variant="secondary">
            <Settings className="h-5 w-5" />
            הגדרות
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl shadow-inner"
                  style={{
                    background: `linear-gradient(180deg, ${currentChildProfile?.avatarSeed.bodyColor ?? '#FFD166'} 0%, #ffffff 100%)`,
                  }}
                >
                  ✨
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{currentChildProfile?.name ?? 'חבר חדש'}</h2>
                  <p className="text-sm text-slate-500">{currentUser?.name ?? 'מצב דמו'}</p>
                </div>
              </div>
              <ProgressBar accent="#f26a4b" label="נקודות ניסיון" value={(xp % 500) / 5} valueLabel={`${xp} נקודות`} />
              <div className="flex items-center justify-between rounded-[24px] bg-[#fff7ed] px-4 py-4">
                <span className="font-semibold text-slate-700">מטבעות</span>
                <span className="inline-flex items-center gap-2 font-bold text-[#f59e0b]">
                  <Coins className="h-5 w-5" />
                  {coins}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[24px] bg-[#fff7d1] px-4 py-4">
                <span className="font-semibold text-slate-700">כוכבים</span>
                <span className="inline-flex items-center gap-2 font-bold text-[#d97706]">
                  <Sparkles className="h-5 w-5" />
                  {stars}
                </span>
              </div>
            </Card>
          </aside>

          <Card className="relative min-h-[620px] overflow-hidden p-0">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 650">
              <path
                d="M830 560 C760 470 690 420 600 300 S390 160 300 250 S160 420 120 560"
                fill="none"
                stroke="#f26a4b"
                strokeDasharray="16 18"
                strokeLinecap="round"
                strokeWidth="16"
                opacity="0.22"
              />
            </svg>

            <div className="relative min-h-[620px]">
              {worldCatalog.map((world) => {
                const isUnlocked = unlockedWorlds.includes(world.id)
                const completedCount =
                  currentChildProfile?.completedLevelIds.filter((levelId) =>
                    missionCatalog.some((mission) => mission.worldId === world.id && mission.levelId === levelId),
                  ).length ?? 0
                const totalCount = missionCatalog.filter((mission) => mission.worldId === world.id).length
                const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

                return (
                  <button
                    className={`absolute ${nodePositions[world.id]} pulse-soft w-[220px] -translate-x-1/2 rounded-[32px] border border-white/80 p-5 text-right shadow-[0_20px_40px_rgba(15,23,42,0.12)] transition hover:scale-[1.03]`}
                    key={world.id}
                    onClick={() => isUnlocked && navigate(`/worlds/${world.id}/missions`)}
                    style={{
                      background: isUnlocked
                        ? world.themeGradient
                        : 'linear-gradient(135deg, #e5e7eb 0%, #f8fafc 100%)',
                      opacity: isUnlocked ? 1 : 0.8,
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-4xl">{world.icon}</p>
                        <h3 className="mt-3 font-display text-2xl text-slate-900">{world.name}</h3>
                        <p className="mt-2 text-sm text-slate-600">{world.subtitle}</p>
                      </div>
                      <span className="rounded-full bg-white/75 px-3 py-2 text-xs font-bold text-slate-600">
                        {isUnlocked ? 'פתוח' : 'נעול'}
                      </span>
                    </div>
                    <div className="mt-4">
                      <ProgressBar
                        accent={world.accentColor}
                        label="השלמה"
                        value={progress}
                        valueLabel={`${progress}%`}
                      />
                    </div>
                    <div className="mt-4 rounded-[22px] bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700">
                      {isUnlocked ? 'לחצו כאן כדי לבחור משחק' : 'העולם ייפתח אחרי שתתקדמו'}
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </ScreenLayout>
  )
}
