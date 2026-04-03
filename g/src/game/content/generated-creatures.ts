import type { CreatureDefinition } from '@/types/models'

const magicPupAccentPalette = ['#F59E0B', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6', '#F97316'] as const
const magicPupFavoriteFoods = ['עוּגִיַּת דְּבַשׁ', 'עַנְנֵי תּוּת', 'תַּפּוּחַ נוֹצֵץ', 'חֲלֵב כּוֹכָבִים', 'גְּלִידַת קֶשֶׁת', 'פַּנְקֵייק וָנִיל'] as const
const magicPupFavoriteGames = ['תְּפִיסַת כּוֹכָבִים', 'מַחְבּוֹאִים בַּבַּיִת', 'מֶרְדַּף בַּלוֹנִים', 'קְפִיצוֹת עָנָן', 'מַסְלוּל צַעֲצוּעִים', 'גִּלְגּוּל כַּדּוּר'] as const
const magicPupPersonalities = [
  'חַבְרִי, סַקְרָן וּמִתְכַּרְבֵּל',
  'שָׂמֵחַ, שׁוֹבָב וְאוֹהֵב מִשְׂחָקִים',
  'רָגוּעַ, מָתוֹק וְקַשּׁוּב',
  'אַמִּיץ, רַךְ וְאֵנֶרְגֶּטִי',
  'עָדִין, קוֹפְצָנִי וּמַצְחִיק',
  'סַקְרָן, עַלִּיז וּמָלֵא קֶסֶם',
] as const
const magicPupSounds = [
  { idleLabel: 'פִּיוּ', happyLabel: 'פִּיפִּי־הַי', needyLabel: 'מְמְמְ־חִבּוּק' },
  { idleLabel: 'וּוּף', happyLabel: 'וּוּ־הַי', needyLabel: 'הָאוּו־חֲטִיף' },
  { idleLabel: 'טוּט', happyLabel: 'טְרַלָּלָה', needyLabel: 'פִּי־פִּי' },
  { idleLabel: 'בִּיפּ', happyLabel: 'בִּינְגּוֹ', needyLabel: 'בּוֹפּ־בּוֹפּ' },
  { idleLabel: 'צִ׳ירְפּ', happyLabel: 'צִ׳ירִי', needyLabel: 'צִ׳וּ־צִ׳וּ' },
  { idleLabel: 'פְּלַאפּ', happyLabel: 'פְּלַאפִי', needyLabel: 'פּוּ־פּוּ' },
] as const

const baseMagicPupNeeds: CreatureDefinition['needs'] = {
  hungerIntervalMinutes: 30,
  pettingIntervalMinutes: 20,
  playIntervalMinutes: 28,
  restIntervalMinutes: 40,
  hungerIntervalSeconds: 75,
  pettingIntervalSeconds: 40,
  pettingRewardClicks: 3,
  feedingFillItems: 3,
  feedingRewardEveryCount: 3,
  rewardStars: {
    feed: 5,
    pet: 1,
    play: 4,
    rest: 2,
  },
}

const magicPupCount = 23
const magicEggCount = 6
const magicPupPriceStarsBySequence = [
  20, 20, 20, 34, 41, 36, 48, 39, 52, 45, 37, 57, 43, 34, 48, 39, 52, 36, 45, 41, 57, 43, 37,
] as const
const magicPupPremiumCoinPriceBySequence: Partial<Record<number, number>> = {
  21: 150,
  22: 180,
  23: 220,
}
const normalMagicPupHatchDurationMinutes = 120

function getMagicPupPriceStars(sequence: number) {
  return magicPupPriceStarsBySequence[sequence - 1]
}

export const generatedCreatureCatalog: CreatureDefinition[] = Array.from({ length: magicPupCount }, (_, index) => {
  const sequence = index + 1
  const paddedSequence = String(sequence).padStart(2, '0')
  const eggSequence = (index % magicEggCount) + 1
  const priceStars = getMagicPupPriceStars(sequence)
  const priceCoins = magicPupPremiumCoinPriceBySequence[sequence]

  return {
    id: `magic-pup-${paddedSequence}`,
    name: `גּוּר קָסוּם ${sequence}`,
    description: 'גּוּר חָדָשׁ שֶׁאוֹהֵב לְשַׂחֵק, לְקַבֵּל לִטּוּפִים וּלְהִסְתּוֹבֵב בַּבַּיִת הַקָּסוּם.',
    ...(typeof priceCoins === 'number' ? { priceCoins } : { priceStars }),
    accent: magicPupAccentPalette[index % magicPupAccentPalette.length],
    eggImage: `/assets/pets/eggs/e${eggSequence}.png`,
    cardImage: `/assets/pets/puppies/g${sequence}.png`,
    hatchDurationMinutes: normalMagicPupHatchDurationMinutes,
    favoriteFood: magicPupFavoriteFoods[index % magicPupFavoriteFoods.length],
    favoriteGame: magicPupFavoriteGames[index % magicPupFavoriteGames.length],
    personality: magicPupPersonalities[index % magicPupPersonalities.length],
    sounds: magicPupSounds[index % magicPupSounds.length],
    needs: baseMagicPupNeeds,
    stages: [
      {
        id: `magic-pup-${paddedSequence}-baby`,
        name: `גּוּר קָסוּם ${sequence}`,
        image: `/assets/pets/puppies/g${sequence}.png`,
        requiredLifetimeMinutes: 0,
        requiredCare: {
          feedCount: 0,
          petCount: 0,
          playCount: 0,
          restCount: 0,
        },
      },
    ],
  }
})
