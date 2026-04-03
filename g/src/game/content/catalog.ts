import type {
  AvatarCatalog,
  ChildProfile,
  MissionDefinition,
  ParentInsight,
  ShopCategory,
  ShopItem,
  WorldDefinition,
} from '@/types/models'
import shopItemPriceOverridesJson from './shop-item-price-overrides.json'
import shopItemsJson from './shop-items.json'

export const avatarCatalog: AvatarCatalog = {
  hair: ['כֶּתֶר כּוֹכָבִים', 'קוֹקִיּוֹת קֶשֶׁת', 'בָּרָק כָּתוֹם', 'גַּל יָרֵחַ'],
  eyes: ['עֵינֵי נִיצוֹץ', 'עֵינֵי כּוֹכָב', 'עֵינֵי עָנָן', 'עֵינֵי לֵב'],
  clothes: ['גְּלִימַת סוּפֶּרִית', 'שִׁרְיוֹן חָלָל', 'חוּלְצַת צְבָעִים', 'חֲלִיפַת יַעַר'],
  pets: ['פַּנְדָּה יָרֵחַ', 'דְּרָקוֹן מַסְטִיק', 'שׁוּעַל שָׁבִיט', 'דֻּבִּי גְלִיטֶר'],
}

const demoAges = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const
const demoBodyColors = ['#FFD166', '#7BDFF2', '#F9A8D4', '#86EFAC', '#C4B5FD', '#FDBA74', '#93C5FD', '#FCA5A5', '#67E8F9']
const demoFavoriteSubjects = ['חֶשְׁבּוֹן', 'קְרִיאָה', 'אַנְגְּלִית', 'לוֹגִיקָה', 'זִיכָּרוֹן']
const demoPetNames = ['נוּנִי', 'טוֹפִי', 'פִּיפִּי', 'זֹהַר', 'נִיצָה', 'בִּיסְלִי', 'מִילְקִי', 'קוֹקוֹ', 'לוּלִי']
const demoCompletedLevelIds = [
  'forest-numbers-001',
  'castle-reading-001',
  'space-english-001',
  'logic-cave-001',
  'memory-island-001',
]
const nikudPattern = /[\u0591-\u05C7]/g
const stripNikud = (value: string) => value.replace(nikudPattern, '')

export const seedChildProfiles: ChildProfile[] = demoAges.map((age, index) => ({
  id: `demo-noa-${age}`,
  name: `נועה ${age}`,
  age,
  level: 1 + index,
  favoriteSubject: demoFavoriteSubjects[index % demoFavoriteSubjects.length],
  petName: demoPetNames[index % demoPetNames.length],
  completedLevelIds: [...demoCompletedLevelIds],
  advancedCompletedLevelIds: [],
  activeLevelTrack: 'standard',
  equippedItems: index === 0 ? ['starlight-cape'] : [],
  avatarSeed: {
    bodyColor: demoBodyColors[index % demoBodyColors.length],
    hair: stripNikud(avatarCatalog.hair[index % avatarCatalog.hair.length]),
    eyes: stripNikud(avatarCatalog.eyes[index % avatarCatalog.eyes.length]),
    outfit: stripNikud(avatarCatalog.clothes[index % avatarCatalog.clothes.length]),
    pet: stripNikud(avatarCatalog.pets[index % avatarCatalog.pets.length]),
  },
}))

export const worldCatalog: WorldDefinition[] = [
  {
    id: 'forest-of-numbers',
    name: 'יַעַר הַמִּסְפָּרִים',
    subtitle: 'יַעַר הַמִּסְפָּרִים הַקּוֹפְצִים',
    description: 'הַרְפַּתְקָאוֹת סְפִירָה, חִבּוּר וְהַשְׁלָמַת תַּבְנִיּוֹת.',
    icon: '🌳',
    accentColor: '#4BAA71',
    themeGradient: 'linear-gradient(135deg, #B8F2C6 0%, #FFF4BE 100%)',
    subject: 'math',
    missionIds: ['forest-bloom', 'forest-echo'],
  },
  {
    id: 'castle-of-reading',
    name: 'טִירַת הַקְּרִיאָה',
    subtitle: 'טִירַת הַסִּיפּוּרִים',
    description: 'אוֹתִיּוֹת, מִלִּים וַהֲבָנַת הַנִּקְרָא בְּמִשִׂימוֹת קְצָרוֹת.',
    icon: '🏰',
    accentColor: '#FF8A5B',
    themeGradient: 'linear-gradient(135deg, #FFD5C2 0%, #FFF0D1 100%)',
    subject: 'reading',
    missionIds: ['castle-gate', 'castle-library'],
  },
  {
    id: 'space-english',
    name: 'חֲלַל הָאַנְגְּלִית',
    subtitle: 'מַסְלוּל מִלִּים בֵּין כּוֹכָבִים',
    description: 'אוֹצַר מִלִּים בְּסִיסִי וְהַתְאָמָה בֵּין תְּמוּנָה לְמִלָּה.',
    icon: '🚀',
    accentColor: '#5D7CFA',
    themeGradient: 'linear-gradient(135deg, #C7D8FF 0%, #E8F1FF 100%)',
    subject: 'english',
    missionIds: ['space-docking', 'space-comet'],
  },
  {
    id: 'logic-cave',
    name: 'מְעָרַת הַלּוֹגִיקָה',
    subtitle: 'מְעָרַת הַחֲשִׁיבָה',
    description: 'תַּבְנִיּוֹת, הַתְאָמָה וַהֲסָקַת מַסְקָנוֹת.',
    icon: '🧠',
    accentColor: '#8C61FF',
    themeGradient: 'linear-gradient(135deg, #E7DBFF 0%, #F8F0FF 100%)',
    subject: 'logic',
    missionIds: ['logic-crystals', 'logic-echo'],
  },
  {
    id: 'memory-island',
    name: 'אִי הַזִּיכָּרוֹן',
    subtitle: 'אִי הַזִּיכָּרוֹן הַחֲבֵרִי',
    description: 'כַּרְטִיסִיּוֹת, חִזּוּק זִיכָּרוֹן וְרִיכּוּז.',
    icon: '🏝️',
    accentColor: '#14B8A6',
    themeGradient: 'linear-gradient(135deg, #BDF3F0 0%, #E7FFF8 100%)',
    subject: 'memory',
    missionIds: ['memory-shells', 'memory-parade'],
  },
]

export const missionCatalog: MissionDefinition[] = [
  {
    id: 'forest-bloom',
    worldId: 'forest-of-numbers',
    levelId: 'forest-numbers-001',
    name: 'שְׁבִיל הַזְּרָעִים',
    description: 'מוֹצְאִים אֶת הַכַּמּוּת הַנְּכוֹנָה וּמַמְשִׁיכִים לַיַּעַר.',
    difficulty: 1,
    subject: 'math',
    icon: '🌱',
    isLocked: false,
  },
  {
    id: 'forest-echo',
    worldId: 'forest-of-numbers',
    levelId: 'forest-numbers-002',
    name: 'צְלִילֵי הַסְּפִירָה',
    description: 'נִפְתָּח אַחֲרֵי סִיּוּם הַמְּשִׂימָה הָרִאשׁוֹנָה.',
    difficulty: 2,
    subject: 'math',
    icon: '🍄',
    isLocked: true,
  },
  {
    id: 'castle-gate',
    worldId: 'castle-of-reading',
    levelId: 'castle-reading-001',
    name: 'מַפְתֵּחַ הָאוֹתִיּוֹת',
    description: 'גּוֹרְרִים כָּל מִלָּה לַשַּׁעַר הַמַּתְאִים.',
    difficulty: 1,
    subject: 'reading',
    icon: '🗝️',
    isLocked: false,
  },
  {
    id: 'castle-library',
    worldId: 'castle-of-reading',
    levelId: 'castle-reading-002',
    name: 'סִפְרִיַּת הַחֲרוּזִים',
    description: 'מְשִׂימָה מִתְקַדֶּמֶת לְהַרְחָבַת הַקְּרִיאָה.',
    difficulty: 2,
    subject: 'reading',
    icon: '📚',
    isLocked: true,
  },
  {
    id: 'space-docking',
    worldId: 'space-english',
    levelId: 'space-english-001',
    name: 'תַּחֲנַת עֲגִינָה',
    description: 'מַתְאִימִים מִלָּה בְּאַנְגְּלִית לַתְּמוּנָה הַנְּכוֹנָה.',
    difficulty: 1,
    subject: 'english',
    icon: '🛰️',
    isLocked: false,
  },
  {
    id: 'space-comet',
    worldId: 'space-english',
    levelId: 'space-english-002',
    name: 'מֶרְדַּף שָׁבִיט',
    description: 'יִפָּתַח אַחֲרֵי חִזּוּק בְּסִיסִי.',
    difficulty: 2,
    subject: 'english',
    icon: '☄️',
    isLocked: true,
  },
  {
    id: 'logic-crystals',
    worldId: 'logic-cave',
    levelId: 'logic-cave-001',
    name: 'קְרִיסְטָלִים תּוֹאֲמִים',
    description: 'מוֹצְאִים זוּגוֹת חֲשִׁיבָה נְכוֹנִים.',
    difficulty: 2,
    subject: 'logic',
    icon: '💎',
    isLocked: false,
  },
  {
    id: 'logic-echo',
    worldId: 'logic-cave',
    levelId: 'logic-cave-002',
    name: 'הֵדִים בַּמְּעָרָה',
    description: 'מְשִׂימַת הֶמְשֵׁךְ עִם סִדְרוֹת מוּרְכָּבוֹת יוֹתֵר.',
    difficulty: 3,
    subject: 'logic',
    icon: '🔦',
    isLocked: true,
  },
  {
    id: 'memory-shells',
    worldId: 'memory-island',
    levelId: 'memory-island-001',
    name: 'צְדָפִים זוֹהֲרִים',
    description: 'פּוֹתְחִים קְלָפִים וּמְחַפְּשִׂים זוּגוֹת.',
    difficulty: 1,
    subject: 'memory',
    icon: '🐚',
    isLocked: false,
  },
  {
    id: 'memory-parade',
    worldId: 'memory-island',
    levelId: 'memory-island-002',
    name: 'מִצְעַד הַצְּבָעִים',
    description: 'שְׁלַב זִיכָּרוֹן מִתְקַדֵּם.',
    difficulty: 2,
    subject: 'memory',
    icon: '🎈',
    isLocked: true,
  },
]

const shopItemPriceOverrides = shopItemPriceOverridesJson as Record<string, number>

const baseShopCatalog = shopItemsJson as ShopItem[]

export const shopCatalog: ShopItem[] = baseShopCatalog.map((item) => {
  const overriddenPrice = shopItemPriceOverrides[item.id]
  const currency = item.currency ?? 'stars'

  if (typeof overriddenPrice !== 'number') {
    return {
      ...item,
      currency,
    }
  }

  return {
    ...item,
    currency,
    price: overriddenPrice,
  }
})

export const subjectLabels: Record<string, string> = {
  math: 'חֶשְׁבּוֹן',
  reading: 'קְרִיאָה',
  english: 'אַנְגְּלִית',
  logic: 'לוֹגִיקָה',
  memory: 'זִיכָּרוֹן',
}

export const shopCategoryLabels: Record<ShopCategory, string> = {
  Eggs: 'בֵּיצִים',
  Clothes: 'בְּגָדִים',
  Accessories: 'אֲבִיזָרִים',
  Props: 'חֲפָצִים',
}

export const parentInsights: ParentInsight[] = [
  { label: 'זְמַן לְמִידָה יוֹמִי', value: 72, accent: '#F97316' },
  { label: 'דִּיּוּק בִּקְרִיאָה', value: 84, accent: '#14B8A6' },
  { label: 'חוּזְקָה בַּזִּיכָּרוֹן', value: 91, accent: '#8B5CF6' },
]

export const badgeCatalog = [
  { id: 'math-sprout', name: 'נִצַּן מִסְפָּרִים', icon: '🌿' },
  { id: 'story-key', name: 'מַפְתֵּחַ סִיפּוּרִים', icon: '🗝️' },
  { id: 'memory-spark', name: 'נִיצוֹץ זִיכָּרוֹן', icon: '✨' },
  { id: 'logic-lamp', name: 'מְנוֹרַת חֲשִׁיבָה', icon: '💡' },
]

export function getWorldById(worldId: string) {
  return worldCatalog.find((world) => world.id === worldId)
}

export function getMissionById(missionId: string) {
  return missionCatalog.find((mission) => mission.id === missionId)
}

export function getMissionByLevelId(levelId: string) {
  return missionCatalog.find((mission) => mission.levelId === levelId)
}

export function getShopItemById(itemId: string) {
  return shopCatalog.find((item) => item.id === itemId)
}
