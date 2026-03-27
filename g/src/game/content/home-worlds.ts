import { missionCatalog } from '@/game/content/catalog'

export interface HomeWorldDefinition {
  id: string
  name: string
  description: string
  backgroundImage: string
  accent: string
  requiredCompletedLevels: number
}

const homeWorldCount = 13
const homeWorldAccents = [
  '#f26a4b',
  '#f59e0b',
  '#14b8a6',
  '#8b5cf6',
  '#ec4899',
  '#3b82f6',
  '#22c55e',
  '#fb7185',
  '#6366f1',
  '#f97316',
  '#0ea5e9',
  '#84cc16',
  '#a855f7',
] as const

const maxCompletedLevelsForUnlocks = Math.max(1, missionCatalog.length)
const unlockStepDivisor = Math.max(1, homeWorldCount - 1)

export const homeWorldCatalog: HomeWorldDefinition[] = Array.from({ length: homeWorldCount }, (_, index) => {
  const sequence = index + 1
  const requiredCompletedLevels = Math.ceil((index * maxCompletedLevelsForUnlocks) / unlockStepDivisor)

  return {
    id: `playroom-${sequence}`,
    name: sequence === 1 ? 'חֶדֶר הַגּוּרִים הָרִאשׁוֹן' : `חֶדֶר קָסוּם ${sequence}`,
    description:
      requiredCompletedLevels === 0
        ? 'פָּתוּחַ כְּבָר מֵהַהַתְחָלָה.'
        : `נִפְתָּח אַחֲרֵי ${requiredCompletedLevels} שְׁלָבִים שֶׁהֻשְׁלְמוּ בְּהַצְלָחָה.`,
    backgroundImage: `/assets/world/playroom-bg${sequence}.png`,
    accent: homeWorldAccents[index % homeWorldAccents.length],
    requiredCompletedLevels,
  }
})

export function getHomeWorldById(homeWorldId: string) {
  return homeWorldCatalog.find((homeWorld) => homeWorld.id === homeWorldId) ?? null
}
