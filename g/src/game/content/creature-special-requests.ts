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
  | 'doze'
  | 'bow'
  | 'sniffle'
  | 'dig'
  | 'shake'
  | 'sprint'
  | 'nest'

export type CreatureSpecialRequestInteraction =
  | 'tap'
  | 'hold'
  | 'lift'
  | 'sway'
  | 'spin'
  | 'dash'
  | 'bounce'
  | 'lower'
  | 'shake'
  | 'scratch'
  | 'sniff'

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
  hintLabel?: string
  requiredItemId?: string
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
    hintLabel: 'מַרִימִים לְמַעְלָה',
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
    hintLabel: 'מַחֲזִיקִים רֶגַע',
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
    hintLabel: 'מְנַדְנְדִים יָמִין־שְׂמֹאל',
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
    hintLabel: 'מְסוֹבְבִים עָגוֹל',
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
    hintLabel: 'מַעֲבִירִים מַהֵר הַצִּדָּה',
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
    hintLabel: 'מוֹרִידִים וּמְשַׁחְרְרִים',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🥳',
  },
  {
    id: 'play-bow',
    label: 'רוֹצֶה קְשַׁת מִשְׂחָק',
    emoji: '🐶',
    bubbleClass: mintBubbleClass,
    animation: 'bow',
    interaction: 'lower',
    hintEmoji: '⬇️',
    hintLabel: 'מוֹרִידִים לְמַטָּה',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😄',
  },
  {
    id: 'settle-down',
    label: 'רוֹצֶה לְהִשְׁתַּרְעֵעַ',
    emoji: '🌙',
    bubbleClass: roseBubbleClass,
    animation: 'doze',
    interaction: 'lower',
    hintEmoji: '🛏️',
    hintLabel: 'מוֹרִידִים לַמִּטָּה',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '💤',
  },
  {
    id: 'nest-circle',
    label: 'רוֹצֶה לְהִתְכּוֹנֵן לִישֹׁן',
    emoji: '🛌',
    bubbleClass: amberBubbleClass,
    animation: 'nest',
    interaction: 'spin',
    hintEmoji: '🔄',
    hintLabel: 'מְסוֹבְבִים לִפְנֵי שֵׁנָה',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😴',
  },
  {
    id: 'sniff-trail',
    label: 'רוֹצֶה לַחְפֹּשׂ רֵיחַ',
    emoji: '👃',
    bubbleClass: skyBubbleClass,
    animation: 'sniffle',
    interaction: 'sniff',
    hintEmoji: '🌀',
    hintLabel: 'מְחַפְּשִׂים בְּעִגּוּל קָטָן',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🌼',
  },
  {
    id: 'flower-sniff',
    label: 'רוֹצֶה לְהַרְחִיחַ פֶּרַח',
    emoji: '🌷',
    bubbleClass: mintBubbleClass,
    animation: 'sniffle',
    interaction: 'sniff',
    hintEmoji: '👃',
    hintLabel: 'מְסַמְּנִים עִגּוּל קָטָן',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😊',
  },
  {
    id: 'dig-blanket',
    label: 'רוֹצֶה לַחְפֹּר בַּשְּׂמִיכָה',
    emoji: '🛏️',
    bubbleClass: amberBubbleClass,
    animation: 'dig',
    interaction: 'scratch',
    hintEmoji: '↕️',
    hintLabel: 'מְגַרְדְּרִים לְמַטָּה וּלְמַעְלָה',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🫶',
  },
  {
    id: 'treasure-dig',
    label: 'רוֹצֶה לַחְפֹּר לְאוֹצָר',
    emoji: '🪺',
    bubbleClass: violetBubbleClass,
    animation: 'dig',
    interaction: 'scratch',
    hintEmoji: '↕️',
    hintLabel: 'חוֹפְרִים קָצָר־קָצָר',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '✨',
  },
  {
    id: 'shake-it-off',
    label: 'רוֹצֶה לְהִתְנַעֵר',
    emoji: '🫨',
    bubbleClass: skyBubbleClass,
    animation: 'shake',
    interaction: 'shake',
    hintEmoji: '↔️',
    hintLabel: 'מְנַעַנְעִים מַהֵר',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😆',
  },
  {
    id: 'sparkle-shake',
    label: 'רוֹצֶה לְנַעֵר נִצּוֹצוֹת',
    emoji: '✨',
    bubbleClass: roseBubbleClass,
    animation: 'shake',
    interaction: 'shake',
    hintEmoji: '〰️',
    hintLabel: 'מְנַעַנְעִים זִיג־זַג',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🤩',
  },
  {
    id: 'chase-me',
    label: 'רוֹצֶה שֶׁאֶרְוֹץ אִתּוֹ',
    emoji: '🏃',
    bubbleClass: mintBubbleClass,
    animation: 'sprint',
    interaction: 'dash',
    hintEmoji: '➡️',
    hintLabel: 'מַרְצִים הַצִּדָּה',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🥳',
  },
  {
    id: 'bring-pillow',
    label: 'רוֹצֶה אֶת הַכַּר',
    emoji: '🛏️',
    bubbleClass: violetBubbleClass,
    animation: 'doze',
    hintEmoji: '🛏️',
    hintLabel: 'מְבִיאִים אֶת הַכַּר',
    requiredItemId: 'moon-pillow',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '💤',
  },
  {
    id: 'bring-ball',
    label: 'רוֹצֶה אֶת הַכַּדּוּר',
    emoji: '🎾',
    bubbleClass: amberBubbleClass,
    animation: 'sprint',
    hintEmoji: '🎾',
    hintLabel: 'מְבִיאִים אֶת הַכַּדּוּר',
    requiredItemId: 'sparkle-ball',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🏆',
  },
  {
    id: 'bring-sniff-mat',
    label: 'רוֹצֶה מַשָּׁט רֵיחוֹת',
    emoji: '🌼',
    bubbleClass: mintBubbleClass,
    animation: 'sniffle',
    hintEmoji: '🌼',
    hintLabel: 'מְבִיאִים אֶת הַמַּשָּׁט',
    requiredItemId: 'flower-sniff-mat',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😊',
  },
  {
    id: 'bring-blanket',
    label: 'רוֹצֶה אֶת הַשְּׂמִיכָה',
    emoji: '🧸',
    bubbleClass: skyBubbleClass,
    animation: 'snuggle',
    hintEmoji: '🧸',
    hintLabel: 'מְבִיאִים אֶת הַשְּׂמִיכָה',
    requiredItemId: 'cloud-blanket',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🥰',
  },
  {
    id: 'bring-tunnel',
    label: 'רוֹצֶה אֶת הַמִּנְהֶרֶת',
    emoji: '🌈',
    bubbleClass: amberBubbleClass,
    animation: 'zoom',
    hintEmoji: '🌈',
    hintLabel: 'מְבִיאִים אֶת הַמִּנְהֶרֶת',
    requiredItemId: 'rainbow-tunnel',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😆',
  },
  {
    id: 'bring-ribbon',
    label: 'רוֹצֶה אֶת הַסֶּרֶט',
    emoji: '🪁',
    bubbleClass: roseBubbleClass,
    animation: 'play',
    hintEmoji: '🪁',
    hintLabel: 'מְבִיאִים אֶת הַסֶּרֶט',
    requiredItemId: 'butterfly-ribbon',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🤩',
  },
  {
    id: 'bring-duck',
    label: 'רוֹצֶה אֶת הַבַּרְוָז',
    emoji: '🦆',
    bubbleClass: amberBubbleClass,
    animation: 'cheer',
    hintEmoji: '🦆',
    hintLabel: 'מְבִיאִים אֶת הַבַּרְוָז',
    requiredItemId: 'squeaky-duck',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '😂',
  },
  {
    id: 'bring-plush',
    label: 'רוֹצֶה אֶת בֻּבַּת הַלֵּב',
    emoji: '💗',
    bubbleClass: roseBubbleClass,
    animation: 'snuggle',
    hintEmoji: '💗',
    hintLabel: 'מְבִיאִים אֶת הַבֻּבָּה',
    requiredItemId: 'heart-plush',
    tapsRequired: 1,
    progressEmojis: [],
    completionEmoji: '🫶',
  },
]

const creatureSpecialRequestById = new Map(creatureSpecialRequests.map((request) => [request.id, request] as const))
const randomizedSpecialRequestIntervalsMinutes = [1, 2, 3] as const

export const specialRequestRewardEvery = 3

export function getCreatureSpecialRequestById(requestId: string) {
  return creatureSpecialRequestById.get(requestId)
}

export function getInitialSpecialRequestDelayMs() {
  return (14 + Math.floor(Math.random() * 24)) * 1000
}

export function getNextSpecialRequestDelayMs() {
  const selectedMinutes =
    randomizedSpecialRequestIntervalsMinutes[
      Math.floor(Math.random() * randomizedSpecialRequestIntervalsMinutes.length)
    ]

  return selectedMinutes * 60_000
}

export function pickRandomCreatureSpecialRequest(previousRequestId?: string | null, availableItemIds: string[] = []) {
  const options =
    previousRequestId && creatureSpecialRequests.length > 1
      ? creatureSpecialRequests.filter((request) => request.id !== previousRequestId)
      : creatureSpecialRequests
  const itemAwareOptions = options.filter(
    (request) => !request.requiredItemId || availableItemIds.includes(request.requiredItemId),
  )
  const resolvedOptions = itemAwareOptions.length > 0 ? itemAwareOptions : options.filter((request) => !request.requiredItemId)

  const gestureOptions = resolvedOptions.filter((request) => (request.interaction ?? 'tap') !== 'tap')
  const selectedOptions = gestureOptions.length > 0 && Math.random() < 0.72 ? gestureOptions : resolvedOptions

  return selectedOptions[Math.floor(Math.random() * selectedOptions.length)] ?? resolvedOptions[0] ?? creatureSpecialRequests[0]
}
