import { useEffect, useState } from 'react'
import { House, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { badgeCatalog, getShopItemById, subjectLabels, worldCatalog } from '@/game/content/catalog'
import {
  formatCountdown,
  getCreatureById,
  getCreatureMoodLabel,
  getCreatureNeedState,
  getCurrentCreatureStage,
  getNextCreatureStage,
  getTimeUntilCreatureHatch,
  isCreatureHatched,
} from '@/game/content/creatures'
import { useGame } from '@/hooks/useGame'

export function ProgressScreen() {
  const navigate = useNavigate()
  const { currentChildProfile, inventory, ownedCreatures, progressBySubject, stars, xp } = useGame()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  const featuredCreature = ownedCreatures.find((creature) => {
    const definition = getCreatureById(creature.creatureId)
    return definition ? isCreatureHatched(definition, creature, now) : false
  })
  const featuredDefinition = featuredCreature ? getCreatureById(featuredCreature.creatureId) ?? null : null
  const featuredStage =
    featuredCreature && featuredDefinition ? getCurrentCreatureStage(featuredDefinition, featuredCreature, now) : null

  return (
    <ScreenLayout
      actions={
        <Button onClick={() => navigate('/home')} variant="secondary">
          <House className="h-5 w-5" />
          חזרה לבית
        </Button>
      }
      eyebrow="התקדמות"
      subtitle="פירוט ויזואלי של רמה, נקודות, כוכבים, התקדמות בעולמות והמצב של היצורים בבית."
      title="ההתקדמות שלי"
      tone="mint"
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="space-y-5">
          <div
            className="mx-auto flex h-64 w-48 flex-col items-center justify-center rounded-[40px] border border-white/80 shadow-inner"
            style={{
              background: `linear-gradient(180deg, ${currentChildProfile?.avatarSeed.bodyColor ?? '#FFD166'} 0%, #ffffff 100%)`,
            }}
          >
            <div className="text-6xl">🧒</div>
            <p className="mt-5 rounded-full bg-white/75 px-4 py-2 text-sm font-bold text-slate-700">
              {currentChildProfile?.name}
            </p>
          </div>
          <ProgressBar accent="#f26a4b" label="נקודות ניסיון" value={(xp % 500) / 5} valueLabel={`${xp} נקודות`} />
          <div className="rounded-[24px] bg-[#fff7ed] px-4 py-4">
            <p className="text-sm font-semibold text-slate-500">כוכבים שצברתי</p>
            <p className="mt-2 inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Sparkles className="h-6 w-6 text-[#f59e0b]" />
              {stars}
            </p>
          </div>
          <div className="rounded-[24px] bg-[#eefaf6] px-4 py-4">
            <p className="text-sm font-semibold text-slate-500">היצור המוביל</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {featuredStage?.name ?? (ownedCreatures.length ? 'ביצה בתהליך בקיעה' : 'עדיין אין יצור חדש')}
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="font-display text-3xl text-slate-900">התקדמות בעולמות</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {worldCatalog.map((world) => {
                const subjectProgress = progressBySubject[world.subject] ?? {
                  completed: 0,
                  total: 1,
                  accuracy: 0,
                }
                const percentage = Math.round((subjectProgress.completed / subjectProgress.total) * 100)

                return (
                  <Card className="rounded-[26px] p-4" key={world.id}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{world.icon}</span>
                      <div>
                        <p className="font-bold text-slate-900">{world.name}</p>
                        <p className="text-sm text-slate-500">{subjectLabels[world.subject] ?? world.subtitle}</p>
                      </div>
                    </div>
                    <ProgressBar accent={world.accentColor} className="mt-4" label="השלמה" value={percentage} />
                  </Card>
                )
              })}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-3xl text-slate-900">היצורים שלי</h2>
              <p className="text-sm text-slate-500">כאן רואים בקיעה, צרכים וגדילה לפי הטיפול בכל יצור.</p>
            </div>

            {ownedCreatures.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ownedCreatures.map((ownedCreature) => {
                  const creature = getCreatureById(ownedCreature.creatureId)

                  if (!creature) {
                    return null
                  }

                  const hatched = isCreatureHatched(creature, ownedCreature, now)
                  const stage = hatched ? getCurrentCreatureStage(creature, ownedCreature, now) : null
                  const nextStage = hatched ? getNextCreatureStage(creature, ownedCreature, now) : null
                  const needState = hatched ? getCreatureNeedState(creature, ownedCreature, now) : null

                  return (
                    <Card className="overflow-hidden p-0" key={ownedCreature.creatureId}>
                      <div className="relative min-h-[280px]" style={{ backgroundColor: `${creature.accent}22` }}>
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${hatched ? stage?.image ?? creature.cardImage : creature.eggImage})`,
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                        <div className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur">
                          {hatched
                            ? getCreatureMoodLabel(needState?.primaryNeed ?? null)
                            : `בוקע בעוד ${formatCountdown(getTimeUntilCreatureHatch(creature, ownedCreature, now))}`}
                        </div>
                        <div className="relative flex min-h-[280px] items-end p-4">
                          <div className="w-full rounded-[24px] bg-white/92 px-4 py-4 shadow-lg backdrop-blur">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="font-display text-2xl text-slate-900">
                                {hatched ? stage?.name ?? creature.name : creature.name}
                              </h3>
                              <span className="rounded-full bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#f59e0b]">
                                {ownedCreature.placedInHome ? 'בבית' : 'בסרגל'}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">
                              {hatched
                                ? nextStage
                                  ? `השלב הבא: ${nextStage.name}. צריך עוד ${Math.max(0, nextStage.requiredCare.feedCount - ownedCreature.care.feedCount)} האכלות לפחות.`
                                  : 'היצור כבר הגיע לשלב הגדילה הגבוה ביותר כרגע.'
                                : 'הביצה כבר נרכשה ונמצאת בתהליך בקיעה.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-[26px] bg-[#fffaf5] px-4 py-5 text-sm font-semibold text-slate-600">
                עדיין לא נקנו ביצים או יצורים.
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <h2 className="font-display text-3xl text-slate-900">תגיות שצברתי</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {badgeCatalog.map((badge) => (
                <div className="rounded-[26px] bg-[#fffaf5] px-4 py-5 text-center shadow-sm" key={badge.id}>
                  <div className="text-4xl">{badge.icon}</div>
                  <p className="mt-3 font-bold text-slate-900">{badge.name}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-display text-3xl text-slate-900">האביזרים והבגדים שלי</h2>
            {inventory.length ? (
              <div className="flex flex-wrap gap-3">
                {inventory.map((itemId) => (
                  <span
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                    key={itemId}
                  >
                    {getShopItemById(itemId)?.name ?? itemId}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-500">עדיין לא נרכשו פריטים מהחנות.</p>
            )}
          </Card>
        </div>
      </div>
    </ScreenLayout>
  )
}
