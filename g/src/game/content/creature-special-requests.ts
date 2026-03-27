export type CreatureSpecialRequestMotion =
  | 'cheer'
  | 'curious'
  | 'stretch'
  | 'pet'
  | 'feed'
  | 'play'
  | 'rest'
  | 'soar'
  | 'snuggle'
  | 'sway'
  | 'twirl'
  | 'zoom'
  | 'boing'

export type CreatureSpecialRequestInteraction = 'tap' | 'hold' | 'lift' | 'sway' | 'spin' | 'dash' | 'bounce'

export interface CreatureSpecialRequestDefinition {
  id: string
  label: string
  emoji: string
  bubbleClass: string
  animation: CreatureSpecialRequestMotion
  tapsRequired: number
  progressEmojis: string[]
  completionEmoji: string
  interaction?: CreatureSpecialRequestInteraction
  hintEmoji?: string
}

const roseBubbleClass =
  'bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,229,238,0.94))] text-[#e11d48] ring-[#fecdd3]/80'
const violetBubbleClass =
  'bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,233,254,0.94))] text-[#7c3aed] ring-[#c4b5fd]/80'
const amberBubbleClass =
  'bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,220,0.94))] text-[#d97706] ring-[#fde68a]/80'
const skyBubbleClass =
  'bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(224,242,254,0.94))] text-[#0369a1] ring-[#7dd3fc]/80'
const mintBubbleClass =
  'bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(220,252,231,0.94))] text-[#15803d] ring-[#86efac]/80'

export const creatureSpecialRequests: CreatureSpecialRequestDefinition[] = [
  {
    id: 'cheer-up',
    label: 'צָרִיךְ עִדּוּד',
    emoji: '🥺',
    bubbleClass: roseBubbleClass,
    animation: 'cheer',
    tapsRequired: 3,
    progressEmojis: ['🙂', '😄'],
    completionEmoji: '🤩',
  },
  {
    id: 'cuddle',
    label: 'רוֹצֶה חִבּוּק',
    emoji: '🫂',
    bubbleClass: roseBubbleClass,
    animation: 'pet',
    tapsRequired: 2,
    progressEmojis: ['😊'],
    completionEmoji: '🥰',
  },
  {
    id: 'dance',
    label: 'רוֹצֶה לִרְקֹד',
    emoji: '💃',
    bubbleClass: violetBubbleClass,
    animation: 'play',
    tapsRequired: 3,
    progressEmojis: ['🎶', '😆'],
    completionEmoji: '🪩',
  },
  {
    id: 'stretch',
    label: 'צָרִיךְ מְתִיחָה',
    emoji: '🧘',
    bubbleClass: mintBubbleClass,
    animation: 'stretch',
    tapsRequired: 2,
    progressEmojis: ['🙂'],
    completionEmoji: '😌',
  },
  {
    id: 'listen',
    label: 'רוֹצֶה הַקְשָׁבָה',
    emoji: '👂',
    bubbleClass: skyBubbleClass,
    animation: 'pet',
    tapsRequired: 2,
    progressEmojis: ['😮'],
    completionEmoji: '😊',
  },
  {
    id: 'peekaboo',
    label: 'רוֹצֶה קוּ־קוּ',
    emoji: '🙈',
    bubbleClass: violetBubbleClass,
    animation: 'cheer',
    tapsRequired: 2,
    progressEmojis: ['😯'],
    completionEmoji: '😂',
  },
  {
    id: 'brush',
    label: 'רוֹצֶה סִירוּק',
    emoji: '🪮',
    bubbleClass: amberBubbleClass,
    animation: 'pet',
    tapsRequired: 3,
    progressEmojis: ['🙂', '😌'],
    completionEmoji: '✨',
  },
  {
    id: 'song',
    label: 'רוֹצֶה שִׁיר',
    emoji: '🎵',
    bubbleClass: skyBubbleClass,
    animation: 'cheer',
    tapsRequired: 2,
    progressEmojis: ['🎶'],
    completionEmoji: '🥹',
  },
  {
    id: 'story',
    label: 'רוֹצֶה סִפּוּר',
    emoji: '📖',
    bubbleClass: amberBubbleClass,
    animation: 'rest',
    tapsRequired: 2,
    progressEmojis: ['😯'],
    completionEmoji: '🤗',
  },
  {
    id: 'ball',
    label: 'רוֹצֶה כַּדּוּר',
    emoji: '⚽',
    bubbleClass: violetBubbleClass,
    animation: 'play',
    tapsRequired: 3,
    progressEmojis: ['😃', '🤸'],
    completionEmoji: '🏆',
  },
  {
    id: 'sniff',
    label: 'רוֹצֶה לְהַרְחִיחַ',
    emoji: '🌼',
    bubbleClass: mintBubbleClass,
    animation: 'curious',
    tapsRequired: 2,
    progressEmojis: ['🙂'],
    completionEmoji: '🤗',
  },
  {
    id: 'sunbeam',
    label: 'רוֹצֶה שֶׁמֶשׁ',
    emoji: '☀️',
    bubbleClass: amberBubbleClass,
    animation: 'rest',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😌',
  },
  {
    id: 'nap',
    label: 'רוֹצֶה לְהִתְכַּרְבֵּל',
    emoji: '🛏️',
    bubbleClass: roseBubbleClass,
    animation: 'rest',
    tapsRequired: 2,
    progressEmojis: ['😴'],
    completionEmoji: '💤',
  },
  {
    id: 'spin',
    label: 'רוֹצֶה סִבּוּב',
    emoji: '🌀',
    bubbleClass: violetBubbleClass,
    animation: 'play',
    tapsRequired: 2,
    progressEmojis: ['😄'],
    completionEmoji: '🤩',
  },
  {
    id: 'high-five',
    label: 'רוֹצֶה כַּף',
    emoji: '🖐️',
    bubbleClass: skyBubbleClass,
    animation: 'cheer',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😄',
  },
  {
    id: 'roll',
    label: 'רוֹצֶה גִּלְגּוּל',
    emoji: '🤸',
    bubbleClass: violetBubbleClass,
    animation: 'play',
    tapsRequired: 2,
    progressEmojis: ['😆'],
    completionEmoji: '🤣',
  },
  {
    id: 'look-around',
    label: 'רוֹצֶה לְהִסְתַּכֵּל',
    emoji: '👀',
    bubbleClass: skyBubbleClass,
    animation: 'curious',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '✨',
  },
  {
    id: 'wave',
    label: 'רוֹצֶה לְנַפְנֵף',
    emoji: '👋',
    bubbleClass: skyBubbleClass,
    animation: 'cheer',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😊',
  },
  {
    id: 'wiggle',
    label: 'רוֹצֶה לְהִתְנַעְנֵעַ',
    emoji: '🐾',
    bubbleClass: roseBubbleClass,
    animation: 'cheer',
    tapsRequired: 2,
    progressEmojis: ['😄'],
    completionEmoji: '🤗',
  },
  {
    id: 'toy',
    label: 'רוֹצֶה צַעֲצוּעַ',
    emoji: '🧸',
    bubbleClass: amberBubbleClass,
    animation: 'play',
    tapsRequired: 2,
    progressEmojis: ['😃'],
    completionEmoji: '🥳',
  },
  {
    id: 'water-break',
    label: 'רוֹצֶה לִשְׁתּוֹת',
    emoji: '💧',
    bubbleClass: skyBubbleClass,
    animation: 'feed',
    tapsRequired: 2,
    progressEmojis: ['🙂'],
    completionEmoji: '😋',
  },
  {
    id: 'cloud-watch',
    label: 'רוֹצֶה עֲנָנִים',
    emoji: '☁️',
    bubbleClass: mintBubbleClass,
    animation: 'curious',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😌',
  },
  {
    id: 'magic-spark',
    label: 'רוֹצֶה נִצּוֹץ',
    emoji: '✨',
    bubbleClass: violetBubbleClass,
    animation: 'cheer',
    tapsRequired: 2,
    progressEmojis: ['🤩'],
    completionEmoji: '🌟',
  },
  {
    id: 'hide-and-seek',
    label: 'רוֹצֶה מַחְבּוֹאִים',
    emoji: '🫣',
    bubbleClass: mintBubbleClass,
    animation: 'play',
    tapsRequired: 3,
    progressEmojis: ['😆', '😄'],
    completionEmoji: '🥳',
  },
  {
    id: 'fly-high',
    label: 'רוֹצֶה לָעוּף',
    emoji: '🪽',
    bubbleClass: skyBubbleClass,
    animation: 'soar',
    interaction: 'lift',
    hintEmoji: '⬆️',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🤩',
  },
  {
    id: 'snuggle-hold',
    label: 'רוֹצֶה שֶׁאֶחֱזֹק אוֹתוֹ',
    emoji: '🤲',
    bubbleClass: roseBubbleClass,
    animation: 'snuggle',
    interaction: 'hold',
    hintEmoji: '🫶',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🥰',
  },
  {
    id: 'rock-sideways',
    label: 'רוֹצֶה נַדְנוּד',
    emoji: '🎠',
    bubbleClass: amberBubbleClass,
    animation: 'sway',
    interaction: 'sway',
    hintEmoji: '↔️',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😌',
  },
  {
    id: 'spin-around',
    label: 'רוֹצֶה סִבּוּב עָגוֹל',
    emoji: '🌀',
    bubbleClass: violetBubbleClass,
    animation: 'twirl',
    interaction: 'spin',
    hintEmoji: '🔄',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '✨',
  },
  {
    id: 'zoomies',
    label: 'רוֹצֶה רִיצַת זּוּמִיז',
    emoji: '💨',
    bubbleClass: mintBubbleClass,
    animation: 'zoom',
    interaction: 'dash',
    hintEmoji: '➡️',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😄',
  },
  {
    id: 'spring-jump',
    label: 'רוֹצֶה קְפִיצַת קָפִיץ',
    emoji: '🏀',
    bubbleClass: amberBubbleClass,
    animation: 'boing',
    interaction: 'bounce',
    hintEmoji: '⬇️',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🥳',
  },
]

const creatureSpecialRequestById = new Map(creatureSpecialRequests.map((request) => [request.id, request] as const))
const randomizedSpecialRequestIntervalsMinutes = [1, 2, 3] as const

export const specialRequestRewardEvery = 3

export function getCreatureSpecialRequestById(requestId: string) {
  return creatureSpecialRequestById.get(requestId)
}

export function getInitialSpecialRequestDelayMs() {
  return (22 + Math.floor(Math.random() * 36)) * 1000
}

export function getNextSpecialRequestDelayMs() {
  const selectedMinutes =
    randomizedSpecialRequestIntervalsMinutes[
      Math.floor(Math.random() * randomizedSpecialRequestIntervalsMinutes.length)
    ]

  return selectedMinutes * 60_000
}

export function pickRandomCreatureSpecialRequest(previousRequestId?: string | null) {
  const options =
    previousRequestId && creatureSpecialRequests.length > 1
      ? creatureSpecialRequests.filter((request) => request.id !== previousRequestId)
      : creatureSpecialRequests

  const gestureOptions = options.filter((request) => (request.interaction ?? 'tap') !== 'tap')
  const selectedOptions = gestureOptions.length > 0 && Math.random() < 0.55 ? gestureOptions : options

  return selectedOptions[Math.floor(Math.random() * selectedOptions.length)] ?? creatureSpecialRequests[0]
}
