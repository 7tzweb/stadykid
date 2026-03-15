import { useEffect, useState } from 'react'
import { Check, Coins, House, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  creatureCatalog,
  formatCountdown,
  formatMinutesLabel,
  getCurrentCreatureStage,
  getOwnedCreatureById,
  getTimeUntilCreatureHatch,
  isCreatureHatched,
} from '@/game/content/creatures'
import { shopCatalog, shopCategoryLabels } from '@/game/content/catalog'
import { useGame } from '@/hooks/useGame'
import type { ShopCategory } from '@/types/models'

const categories: ShopCategory[] = ['Eggs', 'Clothes', 'Accessories']

export function ShopScreen() {
  const navigate = useNavigate()
  const { buyCreature, buyItem, coins, inventory, ownedCreatures, stars } = useGame()
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('Eggs')
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  const visibleItems = shopCatalog.filter((item) => item.category === activeCategory)

  return (
    <ScreenLayout
      actions={
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/home')} variant="secondary">
            <House className="h-5 w-5" />
            חזרה לבית
          </Button>
          <Button onClick={() => navigate('/worlds')} variant="secondary">
            עולם השאלות
          </Button>
        </div>
      }
      eyebrow="חנות"
      subtitle="כאן קונים ביצים של יצורים עם כוכבים, ובגדים ואביזרים עם מטבעות מהמשחקים."
      title="חנות הבית הקסום"
      tone="sand"
    >
      <div className="space-y-6">
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                  activeCategory === category ? 'bg-[#f26a4b] text-white' : 'bg-white text-slate-600'
                }`}
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {shopCategoryLabels[category]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff5bf] px-4 py-3 font-bold text-[#b45309]">
              <Sparkles className="h-5 w-5" />
              {stars}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff7ed] px-4 py-3 font-bold text-[#f59e0b]">
              <Coins className="h-5 w-5" />
              {coins}
            </div>
          </div>
        </Card>

        {message && (
          <p
            className={`rounded-[24px] px-4 py-4 ${
              message.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeCategory === 'Eggs'
            ? creatureCatalog.map((creature) => {
                const ownedCreature = getOwnedCreatureById(creature.id, ownedCreatures)
                const hatched = ownedCreature ? isCreatureHatched(creature, ownedCreature, now) : false
                const stage = ownedCreature && hatched ? getCurrentCreatureStage(creature, ownedCreature, now) : null
                const isDisabled = Boolean(ownedCreature)

                return (
                  <Card className="overflow-hidden p-0" key={creature.id}>
                    <div className="relative min-h-[380px]" style={{ backgroundColor: `${creature.accent}22` }}>
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${
                            ownedCreature
                              ? hatched
                                ? stage?.image ?? creature.cardImage
                                : creature.eggImage
                              : creature.eggImage
                          })`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/16 to-transparent" />
                      <div className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
                        {!ownedCreature && `בקיעה: ${formatMinutesLabel(creature.hatchDurationMinutes)}`}
                        {ownedCreature && !hatched && `בוקע בעוד ${formatCountdown(getTimeUntilCreatureHatch(creature, ownedCreature, now))}`}
                        {ownedCreature && hatched && `גדל ל: ${stage?.name ?? creature.name}`}
                      </div>
                      <div className="relative flex min-h-[380px] items-end p-4">
                        <div className="w-full rounded-[28px] bg-white/92 px-4 py-4 shadow-lg backdrop-blur">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="font-display text-2xl text-slate-900">{creature.name}</h2>
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff5bf] px-4 py-3 font-bold text-[#b45309]">
                              <Sparkles className="h-5 w-5" />
                              {creature.priceStars}
                            </div>
                            <Button
                              className="min-w-[160px]"
                              disabled={isDisabled}
                              onClick={() => {
                                const result = buyCreature(creature.id, creature.priceStars)
                                setMessage(
                                  result === 'success'
                                    ? { text: `נרכשה ביצה חדשה: ${creature.name}`, tone: 'success' }
                                    : result === 'owned'
                                      ? { text: 'היצור הזה כבר אצלך', tone: 'error' }
                                      : { text: 'אין מספיק כוכבים כרגע', tone: 'error' },
                                )
                              }}
                              variant={isDisabled ? 'secondary' : 'primary'}
                            >
                              {ownedCreature ? (
                                <>
                                  <Check className="h-5 w-5" />
                                  כבר אצלך
                                </>
                              ) : (
                                'קונים ביצה'
                              )}
                            </Button>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p>{creature.description}</p>
                            <p>אוכל אהוב: {creature.favoriteFood}</p>
                            <p>משחק אהוב: {creature.favoriteGame}</p>
                            <p>
                              שלב גדילה הבא נפתח אחרי זמן וטיפול:
                              {' '}
                              {creature.stages[1]?.requiredCare.feedCount ?? 0} האכלות,
                              {' '}
                              {creature.stages[1]?.requiredCare.petCount ?? 0} ליטופים.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            : visibleItems.map((item) => {
                const owned = inventory.includes(item.id)

                return (
                  <Card className="overflow-hidden p-0" key={item.id}>
                    <div
                      className="relative min-h-[340px]"
                      style={{ background: `linear-gradient(180deg, ${item.accent}44 0%, #ffffff 100%)` }}
                    >
                      <div className="flex min-h-[340px] items-center justify-center text-[7rem]">{item.icon}</div>
                      <div className="absolute inset-x-4 bottom-4 rounded-[28px] bg-white/92 px-4 py-4 shadow-lg backdrop-blur">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="font-display text-2xl text-slate-900">{item.name}</h2>
                          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff7ed] px-4 py-3 font-bold text-[#f59e0b]">
                            <Coins className="h-5 w-5" />
                            {item.price}
                          </div>
                          <Button
                            className="min-w-[150px]"
                            disabled={owned}
                            onClick={() => {
                              const didBuy = buyItem(item.id, item.price)
                              setMessage(
                                didBuy
                                  ? { text: `נרכש בהצלחה: ${item.name}`, tone: 'success' }
                                  : owned
                                    ? { text: 'הפריט כבר נמצא במלאי', tone: 'error' }
                                    : { text: 'אין מספיק מטבעות כרגע', tone: 'error' },
                              )
                            }}
                            variant={owned ? 'secondary' : 'primary'}
                          >
                            {owned ? (
                              <>
                                <Check className="h-5 w-5" />
                                נרכש
                              </>
                            ) : (
                              'קונים עכשיו'
                            )}
                          </Button>
                        </div>
                        <p className="mt-4 text-sm text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
        </div>
      </div>
    </ScreenLayout>
  )
}
