import creatureCatalogJson from './creatures.json'

import type {
  CreatureCareAction,
  CreatureCareRequirements,
  CreatureDefinition,
  CreatureStageDefinition,
  OwnedCreature,
} from '@/types/models'

export const creatureCatalog = creatureCatalogJson as CreatureDefinition[]

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

export function createOwnedCreature(creatureId: string, purchasedAt = new Date().toISOString()): OwnedCreature {
  return {
    creatureId,
    purchasedAt,
    placedInHome: false,
    lastFedAt: null,
    lastPettedAt: null,
    lastPlayedAt: null,
    lastRestedAt: null,
    lastSoundAt: null,
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

function getNeedIntervalMs(creature: CreatureDefinition, action: CreatureCareAction) {
  if (action === 'feed') {
    return typeof creature.needs.hungerIntervalSeconds === 'number'
      ? creature.needs.hungerIntervalSeconds * 1000
      : creature.needs.hungerIntervalMinutes * 60_000
  }

  if (action === 'pet') {
    return typeof creature.needs.pettingIntervalSeconds === 'number'
      ? creature.needs.pettingIntervalSeconds * 1000
      : creature.needs.pettingIntervalMinutes * 60_000
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
    const dueAfter = getNeedIntervalMs(creature, action)
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
    return `${remainingMinutes} דקות`
  }

  if (!remainingMinutes) {
    return `${hours} שעות`
  }

  return `${hours} שעות ו-${remainingMinutes} דקות`
}

export function getCreatureMoodLabel(action: CreatureCareAction | null) {
  if (action === 'feed') {
    return 'רעב'
  }

  if (action === 'pet') {
    return 'מחפש ליטוף'
  }

  if (action === 'play') {
    return 'רוצה לשחק'
  }

  if (action === 'rest') {
    return 'צריך מנוחה'
  }

  return 'שמח ומטייל'
}
