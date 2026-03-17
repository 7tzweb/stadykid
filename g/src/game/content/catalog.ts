import type {
  AvatarCatalog,
  ChildProfile,
  MissionDefinition,
  ParentInsight,
  ShopCategory,
  ShopItem,
  WorldDefinition,
} from '@/types/models'

export const avatarCatalog: AvatarCatalog = {
  hair: ['כתר כוכבים', 'קוקיות קשת', 'ברק כתום', 'גל ירח'],
  eyes: ['עיני ניצוץ', 'עיני כוכב', 'עיני ענן', 'עיני לב'],
  clothes: ['גלימה סופרית', 'שריון חלל', 'חולצת צבעים', 'חליפת יער'],
  pets: ['פנדה ירח', 'דרקון מסטיק', 'שועל שביט', 'דובי גליטר'],
}

export const seedChildProfiles: ChildProfile[] = [
  {
    id: 'child-lior',
    name: 'ליאור',
    age: 6,
    level: 5,
    favoriteSubject: 'חשבון',
    petName: 'נוני',
    completedLevelIds: ['forest-numbers-001'],
    equippedItems: ['starlight-cape'],
    avatarSeed: {
      bodyColor: '#FFD166',
      hair: 'קוקיות קשת',
      eyes: 'עיני כוכב',
      outfit: 'חולצת צבעים',
      pet: 'פנדה ירח',
    },
  },
  {
    id: 'child-maya',
    name: 'מאיה',
    age: 8,
    level: 3,
    favoriteSubject: 'קריאה',
    petName: 'טופי',
    completedLevelIds: [],
    equippedItems: ['moon-fox'],
    avatarSeed: {
      bodyColor: '#7BDFF2',
      hair: 'גל ירח',
      eyes: 'עיני ניצוץ',
      outfit: 'גלימה סופרית',
      pet: 'שועל שביט',
    },
  },
]

export const worldCatalog: WorldDefinition[] = [
  {
    id: 'forest-of-numbers',
    name: 'יער המספרים',
    subtitle: 'יער המספרים הקופצים',
    description: 'הרפתקאות ספירה, חיבור והשלמת תבניות.',
    icon: '🌳',
    accentColor: '#4BAA71',
    themeGradient: 'linear-gradient(135deg, #B8F2C6 0%, #FFF4BE 100%)',
    subject: 'math',
    missionIds: ['forest-bloom', 'forest-echo'],
  },
  {
    id: 'castle-of-reading',
    name: 'טירת הקריאה',
    subtitle: 'טירת הסיפורים',
    description: 'אותיות, מילים והבנת הנקרא במשימות קצרות.',
    icon: '🏰',
    accentColor: '#FF8A5B',
    themeGradient: 'linear-gradient(135deg, #FFD5C2 0%, #FFF0D1 100%)',
    subject: 'reading',
    missionIds: ['castle-gate', 'castle-library'],
  },
  {
    id: 'space-english',
    name: 'חלל האנגלית',
    subtitle: 'מסלול מילים בין כוכבים',
    description: 'אוצר מילים בסיסי והתאמות בין תמונה למילה.',
    icon: '🚀',
    accentColor: '#5D7CFA',
    themeGradient: 'linear-gradient(135deg, #C7D8FF 0%, #E8F1FF 100%)',
    subject: 'english',
    missionIds: ['space-docking', 'space-comet'],
  },
  {
    id: 'logic-cave',
    name: 'מערת הלוגיקה',
    subtitle: 'מערת החשיבה',
    description: 'תבניות, התאמות והסקת מסקנות.',
    icon: '🧠',
    accentColor: '#8C61FF',
    themeGradient: 'linear-gradient(135deg, #E7DBFF 0%, #F8F0FF 100%)',
    subject: 'logic',
    missionIds: ['logic-crystals', 'logic-echo'],
  },
  {
    id: 'memory-island',
    name: 'אי הזיכרון',
    subtitle: 'אי הזיכרון החברי',
    description: 'כרטיסיות, חיזוק זיכרון וריכוז.',
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
    name: 'שביל הזרעים',
    description: 'מוצאים את הכמות הנכונה וממשיכים ליער.',
    difficulty: 1,
    subject: 'math',
    icon: '🌱',
    isLocked: false,
  },
  {
    id: 'forest-echo',
    worldId: 'forest-of-numbers',
    levelId: 'forest-numbers-002',
    name: 'צלילי הספירה',
    description: 'נפתח אחרי סיום המשימה הראשונה.',
    difficulty: 2,
    subject: 'math',
    icon: '🍄',
    isLocked: true,
  },
  {
    id: 'castle-gate',
    worldId: 'castle-of-reading',
    levelId: 'castle-reading-001',
    name: 'מפתח האותיות',
    description: 'גוררים כל מילה לשער המתאים.',
    difficulty: 1,
    subject: 'reading',
    icon: '🗝️',
    isLocked: false,
  },
  {
    id: 'castle-library',
    worldId: 'castle-of-reading',
    levelId: 'castle-reading-002',
    name: 'ספריית החרוזים',
    description: 'משימה מתקדמת להרחבת הקריאה.',
    difficulty: 2,
    subject: 'reading',
    icon: '📚',
    isLocked: true,
  },
  {
    id: 'space-docking',
    worldId: 'space-english',
    levelId: 'space-english-001',
    name: 'תחנת עגינה',
    description: 'מתאימים מילה באנגלית לתמונה הנכונה.',
    difficulty: 1,
    subject: 'english',
    icon: '🛰️',
    isLocked: false,
  },
  {
    id: 'space-comet',
    worldId: 'space-english',
    levelId: 'space-english-002',
    name: 'מרדף שביט',
    description: 'ייפתח אחרי חיזוק בסיסי.',
    difficulty: 2,
    subject: 'english',
    icon: '☄️',
    isLocked: true,
  },
  {
    id: 'logic-crystals',
    worldId: 'logic-cave',
    levelId: 'logic-cave-001',
    name: 'קריסטלים תואמים',
    description: 'מוצאים זוגות חשיבה נכונים.',
    difficulty: 2,
    subject: 'logic',
    icon: '💎',
    isLocked: false,
  },
  {
    id: 'logic-echo',
    worldId: 'logic-cave',
    levelId: 'logic-cave-002',
    name: 'הדים במערה',
    description: 'משימת המשך עם סדרות מורכבות יותר.',
    difficulty: 3,
    subject: 'logic',
    icon: '🔦',
    isLocked: true,
  },
  {
    id: 'memory-shells',
    worldId: 'memory-island',
    levelId: 'memory-island-001',
    name: 'צדפים זוהרים',
    description: 'פותחים קלפים ומחפשים זוגות.',
    difficulty: 1,
    subject: 'memory',
    icon: '🐚',
    isLocked: false,
  },
  {
    id: 'memory-parade',
    worldId: 'memory-island',
    levelId: 'memory-island-002',
    name: 'מצעד הצבעים',
    description: 'שלב זיכרון מתקדם.',
    difficulty: 2,
    subject: 'memory',
    icon: '🎈',
    isLocked: true,
  },
]

export const shopCatalog: ShopItem[] = [
  {
    id: 'starlight-cape',
    category: 'Clothes',
    name: 'גלימת אור כוכבים',
    description: 'נותנת לדמות נוכחות נוצצת במפה.',
    price: 40,
    icon: '🧥',
    accent: '#F97316',
  },
  {
    id: 'jungle-boots',
    category: 'Clothes',
    name: 'מגפי ג׳ונגל',
    description: 'מוכנים לקפיצות ביער המספרים.',
    price: 28,
    icon: '🥾',
    accent: '#16A34A',
  },
  {
    id: 'sunny-cap',
    category: 'Clothes',
    name: 'כובע שמש',
    description: 'שומר על הגור מוכן ליום מואר בחצר.',
    price: 22,
    icon: '🧢',
    accent: '#FB7185',
  },
  {
    id: 'sun-pin',
    category: 'Accessories',
    name: 'סיכת שמש',
    description: 'אביזר קטן עם הרבה מצב רוח.',
    price: 18,
    icon: '🌞',
    accent: '#EAB308',
  },
  {
    id: 'cloud-bag',
    category: 'Accessories',
    name: 'תיק ענן',
    description: 'אוסף בתוכו פרסים מהאי.',
    price: 24,
    icon: '☁️',
    accent: '#06B6D4',
  },
  {
    id: 'sunny-shades',
    category: 'Accessories',
    name: 'משקפי שמש',
    description: 'נותנים לגור מראה קיצי ושמח במיוחד.',
    price: 26,
    icon: '🕶️',
    accent: '#0F172A',
  },
]

export const subjectLabels: Record<string, string> = {
  math: 'חשבון',
  reading: 'קריאה',
  english: 'אנגלית',
  logic: 'לוגיקה',
  memory: 'זיכרון',
}

export const shopCategoryLabels: Record<ShopCategory, string> = {
  Eggs: 'ביצים',
  Clothes: 'בגדים',
  Accessories: 'אביזרים',
}

export const parentInsights: ParentInsight[] = [
  { label: 'זמן למידה יומי', value: 72, accent: '#F97316' },
  { label: 'דיוק בקריאה', value: 84, accent: '#14B8A6' },
  { label: 'חוזקה בזיכרון', value: 91, accent: '#8B5CF6' },
]

export const badgeCatalog = [
  { id: 'math-sprout', name: 'ניצן מספרים', icon: '🌿' },
  { id: 'story-key', name: 'מפתח סיפורים', icon: '🗝️' },
  { id: 'memory-spark', name: 'ניצוץ זיכרון', icon: '✨' },
  { id: 'logic-lamp', name: 'מנורת חשיבה', icon: '💡' },
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
