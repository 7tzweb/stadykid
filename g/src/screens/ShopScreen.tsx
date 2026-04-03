import { useEffect, useState } from 'react'
import { Check, ChevronDown, Coins, House, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  creatureCatalog,
  formatCountdown,
  formatMinutesLabel,
  getCurrentCreatureStage,
  getCreaturePurchasePrice,
  getOwnedCreatureById,
  getTimeUntilCreatureHatch,
  isCreatureHatched,
} from '@/game/content/creatures'
import { shopCatalog, shopCategoryLabels } from '@/game/content/catalog'
import { useGame } from '@/hooks/useGame'
import type { ShopCategory, ShopCurrency, ShopItem, ShopPurchasePrice } from '@/types/models'

const categories: ShopCategory[] = ['Eggs', 'Clothes', 'Accessories', 'Props']
const hiddenStarterCreatureIds = new Set(['moon-fox', 'sun-corgi'])
type AdminPriceTargetKind = 'creature' | 'shop-item'
type MissingFundsState = {
  currency: ShopCurrency
  currentAmount: number
  requiredAmount: number
  itemName: string
}

function getShowcaseCardBackground(accent: string) {
  return {
    background: `radial-gradient(circle at 18% 82%, ${accent}20 0%, transparent 21%), radial-gradient(circle at 84% 18%, #ffdce9 0%, transparent 24%), radial-gradient(circle at 50% 0%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.78) 28%, transparent 62%), linear-gradient(180deg, #fffafb 0%, #fff8f1 48%, ${accent}20 100%)`,
  }
}

function getAdminPriceEditKey(kind: AdminPriceTargetKind, targetId: string) {
  return `${kind}:${targetId}`
}

async function persistCreaturePriceOverride(creatureId: string, priceStars: number) {
  const response = await fetch('/__admin/creature-price-overrides', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      creatureId,
      priceStars,
    }),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(errorPayload?.error ?? 'לא הצלחנו לשמור את המחיר החדש כרגע.')
  }

  return (await response.json()) as { creatureId: string; priceStars: number }
}

async function persistShopItemPriceOverride(itemId: string, price: number) {
  const response = await fetch('/__admin/shop-item-price-overrides', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemId,
      priceStars: price,
    }),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(errorPayload?.error ?? 'לא הצלחנו לשמור את מחיר הפריט החדש כרגע.')
  }

  return (await response.json()) as { itemId: string; priceStars: number }
}

export function ShopScreen() {
  const navigate = useNavigate()
  const { buyCreature, buyItem, coins, inventory, isAdminMode, ownedCreatures, stars } = useGame()
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('Eggs')
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [expandedCreatureId, setExpandedCreatureId] = useState<string | null>(null)
  const [expandedShopItemId, setExpandedShopItemId] = useState<string | null>(null)
  const [adminPriceByCreatureId, setAdminPriceByCreatureId] = useState<Record<string, number>>(() =>
    Object.fromEntries(creatureCatalog.map((creature) => [creature.id, getCreaturePurchasePrice(creature).amount])),
  )
  const [adminPriceByShopItemId, setAdminPriceByShopItemId] = useState<Record<string, number>>(() =>
    Object.fromEntries(shopCatalog.map((item) => [item.id, item.price])),
  )
  const [editingPriceKey, setEditingPriceKey] = useState<string | null>(null)
  const [priceDraftByKey, setPriceDraftByKey] = useState<Record<string, string>>({})
  const [savingPriceKey, setSavingPriceKey] = useState<string | null>(null)
  const [missingFunds, setMissingFunds] = useState<MissingFundsState | null>(null)
  const [highlightedWallet, setHighlightedWallet] = useState<ShopCurrency | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!missingFunds) {
      return undefined
    }

    const timer = window.setTimeout(() => setMissingFunds(null), 3200)
    return () => window.clearTimeout(timer)
  }, [missingFunds])

  useEffect(() => {
    if (!highlightedWallet) {
      return undefined
    }

    const timer = window.setTimeout(() => setHighlightedWallet(null), 1300)
    return () => window.clearTimeout(timer)
  }, [highlightedWallet])

  const visibleItems = shopCatalog.filter((item) => item.category === activeCategory)

  function openAdminPriceEditor(priceKey: string, currentPrice: number) {
    if (!isAdminMode) {
      return
    }

    setEditingPriceKey(priceKey)
    setPriceDraftByKey((current) => ({
      ...current,
      [priceKey]: String(currentPrice),
    }))
  }

  function closeAdminPriceEditor(priceKey: string) {
    setEditingPriceKey((current) => (current === priceKey ? null : current))
  }

  async function saveAdminCreaturePrice(creatureId: string) {
    const priceKey = getAdminPriceEditKey('creature', creatureId)
    const draftValue = priceDraftByKey[priceKey]?.trim() ?? ''
    const parsedPrice = Number(draftValue)
    const creature = creatureCatalog.find((entry) => entry.id === creatureId)
    const currencyLabel = creature && getCreaturePurchasePrice(creature).currency === 'coins' ? 'כֶּסֶף' : 'כּוֹכָבִים'

    if (!draftValue || !Number.isInteger(parsedPrice) || parsedPrice < 0) {
      setMessage({ text: 'מַחִיר חַיָּב לִהְיוֹת מִסְפָּר שָׁלֵם וְלֹא שְׁלִילִי.', tone: 'error' })
      return
    }

    setSavingPriceKey(priceKey)

    try {
      const payload = await persistCreaturePriceOverride(creatureId, parsedPrice)

      setAdminPriceByCreatureId((current) => ({
        ...current,
        [payload.creatureId]: payload.priceStars,
      }))
      setEditingPriceKey((current) => (current === priceKey ? null : current))
      setMessage({ text: `מְחִיר הַיְּצוּר עוּדְכַּן לְ-${payload.priceStars} ${currencyLabel}.`, tone: 'success' })
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'לֹא הִצְלַחְנוּ לְעַדְכֵּן אֶת הַמְּחִיר כָּרֶגַע.',
        tone: 'error',
      })
    } finally {
      setSavingPriceKey(null)
    }
  }

  async function saveAdminShopItemPrice(item: ShopItem) {
    const priceKey = getAdminPriceEditKey('shop-item', item.id)
    const draftValue = priceDraftByKey[priceKey]?.trim() ?? ''
    const parsedPrice = Number(draftValue)

    if (!draftValue || !Number.isInteger(parsedPrice) || parsedPrice < 0) {
      setMessage({ text: 'מַחִיר חַיָּב לִהְיוֹת מִסְפָּר שָׁלֵם וְלֹא שְׁלִילִי.', tone: 'error' })
      return
    }

    setSavingPriceKey(priceKey)

    try {
      const payload = await persistShopItemPriceOverride(item.id, parsedPrice)
      const currencyLabel = (item.currency ?? 'stars') === 'coins' ? 'מַטְבְּעוֹת' : 'כּוֹכָבִים'

      setAdminPriceByShopItemId((current) => ({
        ...current,
        [payload.itemId]: payload.priceStars,
      }))
      setEditingPriceKey((current) => (current === priceKey ? null : current))
      setMessage({ text: `מְחִיר הַפְּרִיט עוּדְכַּן לְ-${payload.priceStars} ${currencyLabel}.`, tone: 'success' })
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'לֹא הִצְלַחְנוּ לְעַדְכֵּן אֶת מְחִיר הַפְּרִיט.',
        tone: 'error',
      })
    } finally {
      setSavingPriceKey(null)
    }
  }

  function showInsufficientFunds(price: ShopPurchasePrice, itemName: string) {
    const currentAmount = price.currency === 'coins' ? coins : stars
    const currencyLabel = price.currency === 'coins' ? 'מַטְבְּעוֹת' : 'כּוֹכָבִים'
    const shortfall = Math.max(price.amount - currentAmount, 0)

    setHighlightedWallet(price.currency)
    setMissingFunds({
      currency: price.currency,
      currentAmount,
      requiredAmount: price.amount,
      itemName,
    })
    setMessage({
      text: `אוּפְּס, חֲסֵרִים עוֹד ${shortfall} ${currencyLabel} כְּדֵי לִקְנוֹת אֶת ${itemName}.`,
      tone: 'error',
    })
  }

  function renderPriceControl({
    kind,
    targetId,
    price,
    currency,
    onSave,
  }: {
    kind: AdminPriceTargetKind
    targetId: string
    price: number
    currency: 'stars' | 'coins'
    onSave: () => void
  }) {
    const priceKey = getAdminPriceEditKey(kind, targetId)
    const isEditingPrice = editingPriceKey === priceKey
    const isSavingPrice = savingPriceKey === priceKey
    const currentPriceDraft = priceDraftByKey[priceKey] ?? String(price)
    const PriceIcon = currency === 'stars' ? Sparkles : Coins

    if (!isAdminMode) {
      return (
        <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#ffe29a] bg-[#fff7d6] px-3 py-1.5 text-[14px] font-bold leading-none text-[#b45309] shadow-[0_10px_18px_rgba(245,158,11,0.14)]">
          <PriceIcon className="h-4 w-4" />
          {price}
        </div>
      )
    }

    if (isEditingPrice) {
      return (
        <form
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#ffe29a] bg-[#fff7d6] px-2 py-1 text-[13px] font-bold leading-none text-[#b45309] shadow-[0_10px_18px_rgba(245,158,11,0.14)]"
          onSubmit={(event) => {
            event.preventDefault()
            onSave()
          }}
        >
          <PriceIcon className="h-4 w-4 shrink-0" />
          <input
            className="w-11 bg-transparent text-center outline-none"
            inputMode="numeric"
            onChange={(event) => {
              const nextValue = event.target.value.replace(/[^\d]/g, '')
              setPriceDraftByKey((current) => ({
                ...current,
                [priceKey]: nextValue,
              }))
            }}
            value={currentPriceDraft}
          />
          <button
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/75 text-emerald-600 transition hover:bg-white"
            disabled={isSavingPrice}
            type="submit"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-slate-500 transition hover:bg-white"
            disabled={isSavingPrice}
            onClick={() => closeAdminPriceEditor(priceKey)}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )
    }

    return (
      <button
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#ffe29a] bg-[#fff7d6] px-3 py-1.5 text-[14px] font-bold leading-none text-[#b45309] shadow-[0_10px_18px_rgba(245,158,11,0.14)] transition hover:-translate-y-[1px] hover:bg-[#fff4ca]"
        onClick={() => openAdminPriceEditor(priceKey, price)}
        type="button"
      >
        <PriceIcon className="h-4 w-4" />
        {price}
      </button>
    )
  }

  return (
    <ScreenLayout
      actions={
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/home')} variant="secondary">
            <House className="h-5 w-5" />
            חזרה לבית
          </Button>
          <Button onClick={() => navigate('/worlds')} variant="secondary">
            עוֹלַם הַשְּׁאֵלוֹת
          </Button>
        </div>
      }
      eyebrow="חֲנוּת"
      subtitle="כאן קונים ביצים ויצורים עם כוכבים או כסף פרימיום. בְּגָדִים, אֲבִיזָרִים וַחֲפָצִים עוֹלִים בְּעִקָּר כּוֹכָבִים, וְרַק כַּמָּה אֲבִיזָרִים מְיֻחָדִים עוֹלִים כֶּסֶף."
      title="חֲנוּת הבית הקסום"
      tone="sand"
      contentClassName="relative"
    >
      <div className="relative space-y-6">
        {isAdminMode && (
          <div className="pointer-events-none absolute right-0 top-0 z-20">
            <div className="inline-flex max-w-[min(92vw,28rem)] items-center gap-2 rounded-full border border-white/70 bg-white/86 px-4 py-2 text-xs font-semibold text-slate-600 shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#f59e0b]" />
              מַצַּב אַדְמִין: לִחְצִי עַל הַמְּחִיר לַעֲרִיכָה
            </div>
          </div>
        )}

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
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-3 font-bold text-[#b45309] transition ${
                highlightedWallet === 'stars'
                  ? 'shop-wallet-alert bg-[#fff0b4] shadow-[0_16px_28px_rgba(245,158,11,0.24)]'
                  : 'bg-[#fff5bf]'
              }`}
            >
              <Sparkles className="h-5 w-5" />
              {stars}
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-3 font-bold text-[#f59e0b] transition ${
                highlightedWallet === 'coins'
                  ? 'shop-wallet-alert bg-[#fff1e2] shadow-[0_16px_28px_rgba(249,115,22,0.2)]'
                  : 'bg-[#fff7ed]'
              }`}
            >
              <Coins className="h-5 w-5" />
              {coins}
            </div>
          </div>
        </Card>

        {missingFunds && (
          <div className="shop-funds-alert rounded-[28px] border border-[#ffd2c1] bg-white/95 px-5 py-4 shadow-[0_18px_44px_rgba(242,106,75,0.14)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
                    missingFunds.currency === 'coins' ? 'bg-[#fff0e1] text-[#ea580c]' : 'bg-[#fff4bf] text-[#b45309]'
                  }`}
                >
                  {missingFunds.currency === 'coins' ? <Coins className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#f26a4b]">
                    אֵין עוֹד מַסְפִּיק {missingFunds.currency === 'coins' ? 'כֶּסֶף' : 'כּוֹכָבִים'} לְקְנִיַּת {missingFunds.itemName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    צָרִיךְ {missingFunds.requiredAmount} וְיֵשׁ לָךְ עַכְשָׁו {missingFunds.currentAmount}.
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${
                  missingFunds.currency === 'coins'
                    ? 'bg-[#fff4e9] text-[#c2410c]'
                    : 'bg-[#fff7d6] text-[#b45309]'
                }`}
              >
                {missingFunds.currency === 'coins' ? <Coins className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                עַכְשָׁו יֵשׁ: {missingFunds.currentAmount}
              </div>
            </div>
          </div>
        )}

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
            ? creatureCatalog.filter((creature) => !hiddenStarterCreatureIds.has(creature.id)).map((creature) => {
                const ownedCreature = getOwnedCreatureById(creature.id, ownedCreatures)
                const hatched = ownedCreature ? isCreatureHatched(creature, ownedCreature, now) : false
                const stage = ownedCreature && hatched ? getCurrentCreatureStage(creature, ownedCreature, now) : null
                const nextStagePreview = creature.stages[1] ?? null
                const isDisabled = Boolean(ownedCreature)
                const isExpanded = expandedCreatureId === creature.id
                const baseCreaturePrice = getCreaturePurchasePrice(creature)
                const creaturePrice = {
                  ...baseCreaturePrice,
                  amount: adminPriceByCreatureId[creature.id] ?? baseCreaturePrice.amount,
                }
                const statusLabel = !ownedCreature
                  ? `בְּקִיעָה: ${formatMinutesLabel(creature.hatchDurationMinutes)}`
                  : !hatched
                    ? `בּוֹקֵעַ בְּעוֹד ${formatCountdown(getTimeUntilCreatureHatch(creature, ownedCreature, now))}`
                    : `גָּדֵל לְ: ${stage?.name ?? creature.name}`

                return (
                  <div key={creature.id}>
                    <div
                      className="relative min-h-[380px] overflow-hidden rounded-[34px] shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                      style={getShowcaseCardBackground(creature.accent)}
                    >
                      <div
                        className="absolute inset-0 rounded-[34px] bg-contain bg-no-repeat"
                        style={{
                          backgroundImage: `url(${
                            ownedCreature
                              ? hatched
                                ? stage?.image ?? creature.cardImage
                                : creature.eggImage
                              : creature.eggImage
                          })`,
                          backgroundPosition: 'center calc(50% + 44px)',
                        }}
                      />
                      <div className="absolute inset-0 rounded-[34px] bg-gradient-to-t from-white/10 via-white/4 to-transparent" />
                      <div className="absolute inset-x-3 top-3 z-10">
                        <div className="w-full rounded-[22px] bg-white/94 px-3 py-2 text-right shadow-[0_10px_18px_rgba(15,23,42,0.06)] backdrop-blur">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                              className="flex min-w-0 flex-1 items-center justify-between gap-2 text-right"
                              onClick={() => setExpandedCreatureId((current) => (current === creature.id ? null : creature.id))}
                              type="button"
                            >
                              <div className="min-w-0">
                                <h2 className="truncate font-display text-[0.84rem] leading-none text-slate-900 sm:text-[0.96rem]">
                                  {creature.name}
                                </h2>
                              </div>
                              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {renderPriceControl({
                              kind: 'creature',
                              targetId: creature.id,
                              price: creaturePrice.amount,
                              currency: creaturePrice.currency,
                              onSave: () => {
                                void saveAdminCreaturePrice(creature.id)
                              },
                            })}

                            <Button
                              className="min-h-[28px] min-w-[66px] shrink-0 px-2 py-0 text-[7.5px] shadow-[0_6px_12px_rgba(242,106,75,0.1)]"
                              disabled={isDisabled}
                              onClick={() => {
                                const result = buyCreature(creature.id, creaturePrice)
                                if (result === 'insufficient-coins' || result === 'insufficient-stars') {
                                  showInsufficientFunds(creaturePrice, creature.name)
                                }
                                setMessage(
                                  result === 'success'
                                    ? { text: `נִרְכְּשָׁה בֵּיצָה חֲדָשָׁה: ${creature.name}`, tone: 'success' }
                                    : result === 'owned'
                                      ? { text: 'הַיְּצוּר הַזֶּה כְּבָר אֶצְלְךָ', tone: 'error' }
                                      : result === 'insufficient-coins'
                                        ? { text: 'אֵין מַסְפִּיק כֶּסֶף פְּרִימְיוּם כָּרֶגַע', tone: 'error' }
                                        : { text: 'אֵין מַסְפִּיק כּוֹכָבִים כָּרֶגַע', tone: 'error' },
                                )
                              }}
                              size="md"
                              variant={isDisabled ? 'secondary' : 'primary'}
                            >
                              {ownedCreature ? (
                                <>
                                  <Check className="h-2.5 w-2.5" />
                                  כְּבָר אֶצְלְךָ
                                </>
                              ) : (
                                'קוֹנִים בֵּיצָה'
                              )}
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 border-t border-slate-200/80 pt-4">
                              <p className="text-xs font-semibold text-slate-500">{statusLabel}</p>
                              <p className="mt-2 text-sm font-semibold text-slate-500">{creature.personality}</p>
                              <p className="mt-3 text-sm leading-6 text-slate-600">{creature.description}</p>

                              <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <p>אוֹכֶל אָהוּב: {creature.favoriteFood}</p>
                                <p>מִשְׂחָק אָהוּב: {creature.favoriteGame}</p>
                                {nextStagePreview ? (
                                  <p>
                                    שְׁלַב הַגְּדִילָה הַבָּא נִפְתָּח אַחֲרֵי
                                    {' '}
                                    {nextStagePreview.requiredCare.feedCount}
                                    {' '}
                                    הַאֲכָלוֹת וְ-
                                    {nextStagePreview.requiredCare.petCount}
                                    {' '}
                                    לִיטוּפִים.
                                  </p>
                                ) : (
                                  <p>לַיְּצוּר הַזֶּה יֵשׁ כָּרֶגַע שְׁלַב בְּקִיעָה אֶחָד וְהוּא מוּכָן לְשַׂחֵק מִיָּד.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative flex min-h-[380px] items-end p-4">
                        <div className="w-full" />
                      </div>
                    </div>
                  </div>
                )
              })
            : visibleItems.map((item) => {
                const owned = inventory.includes(item.id)
                const isExpanded = expandedShopItemId === item.id
                const itemPrice: ShopPurchasePrice = {
                  amount: adminPriceByShopItemId[item.id] ?? item.price,
                  currency: item.currency ?? 'stars',
                }

                return (
                  <div key={item.id}>
                    <div
                      className="relative min-h-[380px] overflow-hidden rounded-[34px] shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                      style={getShowcaseCardBackground(item.accent)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center px-6 pt-14">
                        {item.image ? (
                          <img
                            alt={item.name}
                            className="max-h-[240px] w-full object-contain drop-shadow-[0_18px_28px_rgba(255,255,255,0.35)]"
                            src={item.image}
                          />
                        ) : (
                          <span className="text-[8.5rem] drop-shadow-[0_18px_28px_rgba(255,255,255,0.35)]">{item.icon}</span>
                        )}
                      </div>
                      <div className="absolute inset-0 rounded-[34px] bg-gradient-to-t from-white/10 via-white/4 to-transparent" />
                      <div className="absolute inset-x-3 top-3 z-10">
                        <div className="w-full rounded-[22px] bg-white/94 px-3 py-2 text-right shadow-[0_10px_18px_rgba(15,23,42,0.06)] backdrop-blur">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                              className="flex min-w-0 flex-1 items-center justify-between gap-2 text-right"
                              onClick={() => setExpandedShopItemId((current) => (current === item.id ? null : item.id))}
                              type="button"
                            >
                              <div className="min-w-0">
                                <h2 className="truncate font-display text-[0.84rem] leading-none text-slate-900 sm:text-[0.96rem]">
                                  {item.name}
                                </h2>
                              </div>
                              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {renderPriceControl({
                              kind: 'shop-item',
                              targetId: item.id,
                              price: itemPrice.amount,
                              currency: itemPrice.currency,
                              onSave: () => {
                                void saveAdminShopItemPrice(item)
                              },
                            })}

                            <Button
                              className="min-h-[28px] min-w-[66px] shrink-0 px-2 py-0 text-[7.5px] shadow-[0_6px_12px_rgba(242,106,75,0.1)]"
                              disabled={owned}
                              onClick={() => {
                                const result = buyItem(item.id, itemPrice)
                                if (result === 'insufficient-coins' || result === 'insufficient-stars') {
                                  showInsufficientFunds(itemPrice, item.name)
                                }
                                setMessage(
                                  result === 'success'
                                    ? { text: `נִרְכַּשׁ בְּהַצְלָחָה: ${item.name}`, tone: 'success' }
                                    : result === 'owned'
                                      ? { text: 'הַפְּרִיט כְּבָר נִמְצָא בַּמְּלַאי', tone: 'error' }
                                      : result === 'insufficient-coins'
                                        ? { text: 'אֵין מַסְפִּיק כֶּסֶף כָּרֶגַע.', tone: 'error' }
                                        : { text: 'אֵין מַסְפִּיק כּוֹכָבִים כָּרֶגַע.', tone: 'error' },
                                )
                              }}
                              variant={owned ? 'secondary' : 'primary'}
                            >
                              {owned ? (
                                <>
                                  <Check className="h-2.5 w-2.5" />
                                  נרכש
                                </>
                              ) : (
                                'קוֹנִים עַכְשָׁיו'
                              )}
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 border-t border-slate-200/80 pt-4">
                              <p className="text-xs font-semibold text-slate-500">
                                {item.category === 'Clothes'
                                  ? 'בֶּגֶד קָסוּם'
                                  : item.category === 'Accessories'
                                    ? 'אֲבִיזָר מְיֻחָד'
                                    : 'חֵפֶץ לְגוּרִים'}
                              </p>
                              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative flex min-h-[380px] items-end p-4">
                        <div className="w-full" />
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>
      </div>
    </ScreenLayout>
  )
}
