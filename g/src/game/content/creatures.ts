import creatureCatalogJson from './creatures.json'
import creaturePriceOverridesJson from './creature-price-overrides.json'
import { generatedCreatureCatalog } from './generated-creatures'

import type {
  CreatureCareAction,
  CreatureCareRequirements,
  CreatureDefinition,
  CreaturePurchasePrice,
  CreatureStageDefinition,
  OwnedCreature,
} from '@/types/models'

const creaturePriceOverrides = creaturePriceOverridesJson as Record<string, number>

function applyCreaturePriceOverride(creature: CreatureDefinition): CreatureDefinition {
  const overriddenPrice = creaturePriceOverrides[creature.id]

  if (typeof overriddenPrice !== 'number') {
    return creature
  }

  if (typeof creature.priceCoins === 'number') {
    return {
      ...creature,
      priceCoins: overriddenPrice,
    }
  }

  return {
    ...creature,
    priceStars: overriddenPrice,
  }
}

export const creatureCatalog = [...(creatureCatalogJson as CreatureDefinition[]), ...generatedCreatureCatalog].map(
  applyCreaturePriceOverride,
)

const careTimestampByAction: Record<CreatureCareAction, keyof OwnedCreature> = {
  feed: 'lastFedAt',
  pet: 'lastPettedAt',
  play: 'lastPlayedAt',
  rest: 'lastRestedAt',
}

const careCountByAction: Record<CreatureCareAction, keyof OwnedCreature['care']> = {
  feed: 'feedCount',
  pet: 'petCount',
  play: 'playCount',
  rest: 'restCount',
}

const careActions = ['feed', 'pet', 'play', 'rest'] as const
const careActionOrder: Record<CreatureCareAction, number> = {
  feed: 0,
  pet: 1,
  play: 2,
  rest: 3,
}

export function createOwnedCreature(creatureId: string, purchasedAt = new Date().toISOString()): OwnedCreature {
  return {
    creatureId,
    purchasedAt,
    placedInHome: false,
    placedHomeWorldId: null,
    lastFedAt: null,
    lastPettedAt: null,
    lastPlayedAt: null,
    lastRestedAt: null,
    lastSoundAt: null,
    specialRequestCount: 0,
    care: {
      feedCount: 0,
      petCount: 0,
      playCount: 0,
      restCount: 0,
    },
    equippedItems: [],
  }
}

export function getCreatureById(creatureId: string) {
  return creatureCatalog.find((creature) => creature.id === creatureId)
}

export function getOwnedCreatureById(creatureId: string, ownedCreatures: OwnedCreature[]) {
  return ownedCreatures.find((creature) => creature.creatureId === creatureId)
}

export function getCreatureHatchTimestamp(creature: CreatureDefinition, ownedCreature: OwnedCreature) {
  return new Date(ownedCreature.purchasedAt).getTime() + creature.hatchDurationMinutes * 60_000
}

export function isCreatureHatched(creature: CreatureDefinition, ownedCreature: OwnedCreature, now = Date.now()) {
  return getCreatureHatchTimestamp(creature, ownedCreature) <= now
}

export function getTimeUntilCreatureHatch(
  creature: CreatureDefinition,
  ownedCreature: OwnedCreature,
  now = Date.now(),
) {
  return Math.max(0, getCreatureHatchTimestamp(creature, ownedCreature) - now)
}

function getCareValue(ownedCreature: OwnedCreature, requirements: CreatureCareRequirements, action: CreatureCareAction) {
  return ownedCreature.care[careCountByAction[action]] >= requirements[careCountByAction[action]]
}

function meetsStageRequirements(
  stage: CreatureStageDefinition,
  creature: CreatureDefinition,
  ownedCreature: OwnedCreature,
  now = Date.now(),
) {
  if (!isCreatureHatched(creature, ownedCreature, now)) {
    return false
  }

  const ageMinutes = Math.floor((now - getCreatureHatchTimestamp(creature, ownedCreature)) / 60_000)

  if (ageMinutes < stage.requiredLifetimeMinutes) {
    return false
  }

  return ['feed', 'pet', 'play', 'rest'].every((action) =>
    getCareValue(ownedCreature, stage.requiredCare, action as CreatureCareAction),
  )
}

export function getCurrentCreatureStage(
  creature: CreatureDefinition,
  ownedCreature: OwnedCreature,
  now = Date.now(),
) {
  return creature.stages.reduce<CreatureStageDefinition>(
    (currentStage, stage) => (meetsStageRequirements(stage, creature, ownedCreature, now) ? stage : currentStage),
    creature.stages[0],
  )
}

export function getNextCreatureStage(
  creature: CreatureDefinition,
  ownedCreature: OwnedCreature,
  now = Date.now(),
) {
  return (
    creature.stages.find((stage) => !meetsStageRequirements(stage, creature, ownedCreature, now)) ?? null
  )
}

function getLastActionAt(ownedCreature: OwnedCreature, action: CreatureCareAction) {
  const value = ownedCreature[careTimestampByAction[action]]
  return typeof value === 'string' ? new Date(value).getTime() : new Date(ownedCreature.purchasedAt).getTime()
}

function hashSeed(input: string) {
  let hash = 2166136261

  for (const character of input) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function seededUnit(seed: string) {
  return hashSeed(seed) / 4_294_967_295
}

function getTotalCareCount(ownedCreature: OwnedCreature) {
  return careActions.reduce((total, action) => total + ownedCreature.care[careCountByAction[action]], 0)
}

function getLatestCareAt(ownedCreature: OwnedCreature) {
  return careActions.reduce(
    (latestTimestamp, action) => Math.max(latestTimestamp, getLastActionAt(ownedCreature, action)),
    new Date(ownedCreature.purchasedAt).getTime(),
  )
}

function getRecentCareActions(ownedCreature: OwnedCreature) {
  return careActions
    .map((action) => {
      const lastActionAt = ownedCreature[careTimestampByAction[action]]

      if (typeof lastActionAt !== 'string') {
        return null
      }

      return {
        action,
        at: new Date(lastActionAt).getTime(),
      }
    })
    .filter((entry): entry is { action: CreatureCareAction; at: number } => Boolean(entry))
    .sort((left, right) => {
      if (right.at !== left.at) {
        return right.at - left.at
      }

      return careActionOrder[left.action] - careActionOrder[right.action]
    })
    .map((entry) => entry.action)
}

function getBaseNeedDelayMs(creature: CreatureDefinition, action: CreatureCareAction) {
  if (action === 'feed') {
    const seconds = creature.needs.hungerIntervalSeconds ?? Math.max(48, Math.round(creature.needs.hungerIntervalMinutes * 2.1))
    return seconds * 1000
  }

  if (action === 'pet') {
    const seconds =
      creature.needs.pettingIntervalSeconds ?? Math.max(36, Math.round(creature.needs.pettingIntervalMinutes * 2))
    return seconds * 1000
  }

  if (action === 'play') {
    return Math.max(58, Math.round(creature.needs.playIntervalMinutes * 2.25)) * 1000
  }

  return Math.max(72, Math.round(creature.needs.restIntervalMinutes * 2.1)) * 1000
}

function getNeedDelayMs(creature: CreatureDefinition, ownedCreature: OwnedCreature, action: CreatureCareAction) {
  const totalCareCount = getTotalCareCount(ownedCreature)
  const baseDelayMs = getBaseNeedDelayMs(creature, action)
  const jitterSeed = seededUnit(`${ownedCreature.creatureId}:${totalCareCount}:${action}:need-delay`)
  const jitterMultiplier =
    action === 'feed' || action === 'pet' ? 0.76 + jitterSeed * 0.42 : 0.74 + jitterSeed * 0.48
  const creatureOffsetMs = Math.round(seededUnit(`${ownedCreature.creatureId}:${action}:stagger`) * 10_000)

  return Math.round(baseDelayMs * jitterMultiplier) + creatureOffsetMs
}

function getQueuedNeedBufferMs(creature: CreatureDefinition, ownedCreature: OwnedCreature, action: CreatureCareAction) {
  const queueSeed = seededUnit(`${ownedCreature.creatureId}:${action}:queued-buffer`)
  return Math.round(getBaseNeedDelayMs(creature, action) * (0.38 + queueSeed * 0.24))
}

function pickScheduledNeedAction(creature: CreatureDefinition, ownedCreature: OwnedCreature) {
  const totalCareCount = getTotalCareCount(ownedCreature)
  const averageCareCount = totalCareCount / careActions.length
  const recentActions = getRecentCareActions(ownedCreature)

  return careActions
    .map((action) => {
      const actionCareCount = ownedCreature.care[careCountByAction[action]]
      const balanceBoost = Math.max(-1.4, Math.min(2.8, (averageCareCount - actionCareCount) * 2.2))
      const recentPenalty = recentActions[0] === action ? 3.7 : recentActions[1] === action ? 1.45 : 0
      const firstTimeBoost = actionCareCount === 0 ? 0.72 : 0
      const creatureBias = seededUnit(`${creature.id}:${action}:bias`) * 1.15
      const cycleRandomness = seededUnit(
        `${ownedCreature.creatureId}:${creature.id}:${totalCareCount}:${action}:next-need`,
      ) * 3.25

      return {
        action,
        score: 1 + balanceBoost + firstTimeBoost + creatureBias + cycleRandomness - recentPenalty,
      }
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return careActionOrder[left.action] - careActionOrder[right.action]
    })[0]?.action
}

export function getCreatureNeedState(
  creature: CreatureDefinition,
  ownedCreature: OwnedCreature,
  now = Date.now(),
) {
  const scheduledAction = pickScheduledNeedAction(creature, ownedCreature) ?? 'feed'
  const elapsed = now - getLatestCareAt(ownedCreature)
  const dueAfter = getNeedDelayMs(creature, ownedCreature, scheduledAction)
  const queueRemainingMs = Math.max(0, dueAfter - elapsed)

  const entries = careActions.map((action) => {
    const isScheduledAction = action === scheduledAction
    const queuedBufferMs = getQueuedNeedBufferMs(creature, ownedCreature, action)

    return {
      action,
      isDue: isScheduledAction && elapsed >= dueAfter,
      overdueBy: isScheduledAction ? Math.max(0, elapsed - dueAfter) : 0,
      remainingMs: isScheduledAction ? queueRemainingMs : queueRemainingMs + queuedBufferMs,
    }
  })

  return {
    primaryNeed: elapsed >= dueAfter ? scheduledAction : null,
    entries,
  }
}

export function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function formatMinutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!hours) {
    return `${remainingMinutes} דַּקּוֹת`
  }

  if (!remainingMinutes) {
    return `${hours} שָׁעוֹת`
  }

  return `${hours} שָׁעוֹת וְ-${remainingMinutes} דַּקּוֹת`
}

export function getCreatureMoodLabel(action: CreatureCareAction | null) {
  if (action === 'feed') {
    return 'רָעֵב'
  }

  if (action === 'pet') {
    return 'מְחַפֵּשׂ לִטּוּף'
  }

  if (action === 'play') {
    return 'רוֹצֶה לְשַׂחֵק'
  }

  if (action === 'rest') {
    return 'צָרִיךְ מְנוּחָה'
  }

  return 'שָׂמֵחַ וּמְטַיֵּל'
}

export function getCreaturePurchasePrice(creature: CreatureDefinition): CreaturePurchasePrice {
  if (typeof creature.priceCoins === 'number') {
    return {
      currency: 'coins',
      amount: creature.priceCoins,
    }
  }

  return {
    currency: 'stars',
    amount: creature.priceStars ?? 0,
  }
}
