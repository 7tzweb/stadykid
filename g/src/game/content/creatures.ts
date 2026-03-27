import creatureCatalogJson from './creatures.json'
import creaturePriceOverridesJson from './creature-price-overrides.json'
import { generatedCreatureCatalog } from './generated-creatures'

import type {
  CreatureCareAction,
  CreatureCareRequirements,
  CreatureDefinition,
  CreatureStageDefinition,
  OwnedCreature,
} from '@/types/models'

const creaturePriceOverrides = creaturePriceOverridesJson as Record<string, number>

function applyCreaturePriceOverride(creature: CreatureDefinition): CreatureDefinition {
  const overriddenPrice = creaturePriceOverrides[creature.id]

  if (typeof overriddenPrice !== 'number') {
    return creature
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

const randomizedCareIntervalsMinutes = [1, 2, 3] as const

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
  return input.split('').reduce((total, character) => total + character.charCodeAt(0), 0)
}

function getRandomizedCareIntervalMs(ownedCreature: OwnedCreature, action: Extract<CreatureCareAction, 'feed' | 'pet'>) {
  const referenceTimestamp = ownedCreature[careTimestampByAction[action]] ?? ownedCreature.purchasedAt
  const seed = `${ownedCreature.creatureId}:${action}:${referenceTimestamp}`
  const selectedMinutes = randomizedCareIntervalsMinutes[hashSeed(seed) % randomizedCareIntervalsMinutes.length]

  return selectedMinutes * 60_000
}

function getNeedIntervalMs(creature: CreatureDefinition, ownedCreature: OwnedCreature, action: CreatureCareAction) {
  if (action === 'feed') {
    return getRandomizedCareIntervalMs(ownedCreature, action)
  }

  if (action === 'pet') {
    return getRandomizedCareIntervalMs(ownedCreature, action)
  }

  if (action === 'play') {
    return creature.needs.playIntervalMinutes * 60_000
  }

  return creature.needs.restIntervalMinutes * 60_000
}

export function getCreatureNeedState(
  creature: CreatureDefinition,
  ownedCreature: OwnedCreature,
  now = Date.now(),
) {
  const entries = (['feed', 'pet', 'play', 'rest'] as CreatureCareAction[]).map((action) => {
    const dueAfter = getNeedIntervalMs(creature, ownedCreature, action)
    const elapsed = now - getLastActionAt(ownedCreature, action)

    return {
      action,
      isDue: elapsed >= dueAfter,
      overdueBy: Math.max(0, elapsed - dueAfter),
      remainingMs: Math.max(0, dueAfter - elapsed),
    }
  })

  const primaryNeed = entries
    .filter((entry) => entry.isDue)
    .sort((left, right) => right.overdueBy - left.overdueBy)[0]?.action ?? null

  return {
    primaryNeed,
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
