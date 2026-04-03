import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Research notes based on official Israeli Ministry of Education and RAMA sources:
// - Kindergarten language and literacy: https://pop.education.gov.il/kindergarten/magar-ganey-yeladim/milat-hayom
// - Kindergarten mathematics themes: https://pop.education.gov.il/kindergarten/magar-ganey-yeladim/science-and-mathematics
// - Hebrew grade 1 phonics example: https://pop.education.gov.il/sherutey-tiksuv-bachinuch/vod-broadcasts/no-date-records/language-1-grade-6-4-2/
// - English grade 3 official space: https://pop.education.gov.il/sherutey-tiksuv-bachinuch/vod-broadcasts/hebrew-13-5/english-3-grade-13-5-4/
// - RAMA mathematics grade 3 decimal structure: https://rama.edu.gov.il/tools/test-unit-math-heb-3-3
// - RAMA Hebrew grade 4 comprehension: https://rama.edu.gov.il/tools/test-unit-heb-sipuri-4-2022
// - RAMA English grade 6 aligned to A1: https://rama.edu.gov.il/ar/assessments/eng-arab-6-2025

const supportedAges = [4, 5, 6, 7, 8, 9, 10, 11, 12]
const activitiesPerStage = 30
const defaultAge = 6
const starsPerQuestion = 3
const minimumContentAge = 3
const maximumContentAge = 13

const primaryDifficultyByAge = {
  3: 'easy',
  4: 'easy',
  5: 'easy',
  6: 'easy',
  7: 'medium',
  8: 'medium',
  9: 'medium',
  10: 'medium',
  11: 'hard',
  12: 'hard',
  13: 'hard',
}

const secondaryDifficultyByAge = {
  3: 'easy',
  4: 'easy',
  5: 'easy',
  6: 'medium',
  7: 'medium',
  8: 'medium',
  9: 'medium',
  10: 'hard',
  11: 'hard',
  12: 'hard',
  13: 'hard',
}

const ageProfiles = {
  3: {
    mathPrimaryMax: 8,
    mathSecondaryMax: 8,
    memoryPrimaryPairs: 3,
    memorySecondaryPairs: 3,
  },
  4: {
    mathPrimaryMax: 10,
    mathSecondaryMax: 12,
    memoryPrimaryPairs: 4,
    memorySecondaryPairs: 4,
  },
  5: {
    mathPrimaryMax: 20,
    mathSecondaryMax: 20,
    memoryPrimaryPairs: 4,
    memorySecondaryPairs: 5,
  },
  6: {
    mathPrimaryMax: 20,
    mathSecondaryMax: 30,
    memoryPrimaryPairs: 5,
    memorySecondaryPairs: 5,
  },
  7: {
    mathPrimaryMax: 100,
    mathSecondaryMax: 100,
    memoryPrimaryPairs: 5,
    memorySecondaryPairs: 6,
  },
  8: {
    mathPrimaryMax: 1000,
    mathSecondaryMax: 1000,
    memoryPrimaryPairs: 6,
    memorySecondaryPairs: 6,
  },
  9: {
    mathPrimaryMax: 1000,
    mathSecondaryMax: 1000,
    memoryPrimaryPairs: 6,
    memorySecondaryPairs: 6,
  },
  10: {
    mathPrimaryMax: 1000,
    mathSecondaryMax: 1000,
    memoryPrimaryPairs: 6,
    memorySecondaryPairs: 7,
  },
  11: {
    mathPrimaryMax: 1000,
    mathSecondaryMax: 1000,
    memoryPrimaryPairs: 6,
    memorySecondaryPairs: 7,
  },
  12: {
    mathPrimaryMax: 1000,
    mathSecondaryMax: 1000,
    memoryPrimaryPairs: 7,
    memorySecondaryPairs: 8,
  },
  13: {
    mathPrimaryMax: 1000,
    mathSecondaryMax: 1000,
    memoryPrimaryPairs: 8,
    memorySecondaryPairs: 8,
  },
}

const commonObjects = [
  { singular: 'תַּפּוּחַ', plural: 'תַּפּוּחִים', emoji: '🍎' },
  { singular: 'בַּלוֹן', plural: 'בַּלוֹנִים', emoji: '🎈' },
  { singular: 'פֶּרַח', plural: 'פְּרָחִים', emoji: '🌼' },
  { singular: 'כַּדּוּר', plural: 'כַּדּוּרִים', emoji: '⚽' },
  { singular: 'כּוֹכָב', plural: 'כּוֹכָבִים', emoji: '⭐' },
  { singular: 'חִפּוּשִׁית', plural: 'חִפּוּשִׁיּוֹת', emoji: '🐞' },
  { singular: 'סֵפֶר', plural: 'סְפָרִים', emoji: '📘' },
  { singular: 'צִפּוֹר', plural: 'צִפּוֹרִים', emoji: '🐦' },
  { singular: 'דָּג', plural: 'דָּגִים', emoji: '🐟' },
  { singular: 'לֵב', plural: 'לְבָבוֹת', emoji: '💗' },
  { singular: 'פַּרְפַּר', plural: 'פַּרְפָּרִים', emoji: '🦋' },
  { singular: 'שַׁבְלוּל', plural: 'שַׁבְלוּלִים', emoji: '🐌' },
]

const shapeOptions = [
  { label: 'עִגּוּל', emoji: '⚪' },
  { label: 'מְרֻבָּע', emoji: '⬜' },
  { label: 'מְשֻׁלָּשׁ', emoji: '🔺' },
  { label: 'מַלְבֵּן', emoji: '▭' },
]

const earlyLetterGroups = [
  { letter: 'ב', words: ['בַּיִת', 'בָּנָנָה', 'בּוּבָּה'] },
  { letter: 'ד', words: ['דָּג', 'דֶּלֶת', 'דֹּב'] },
  { letter: 'מ', words: ['מַיִם', 'מֶלֶךְ', 'מַתָּנָה'] },
  { letter: 'ש', words: ['שֶׁמֶשׁ', 'שׁוּלְחָן', 'שׁוֹקוֹ'] },
  { letter: 'פ', words: ['פֶּרַח', 'פָּנָה', 'פֶּלֶא'] },
  { letter: 'ס', words: ['סוּס', 'סַפָּל', 'סֵפֶר'] },
  { letter: 'ל', words: ['לֶחֶם', 'לְבָנָה', 'לִבָּה'] },
  { letter: 'ר', words: ['רִמּוֹן', 'רַכֶּבֶת', 'רוּחַ'] },
  { letter: 'ק', words: ['קוֹף', 'קֶשֶׁת', 'קֻבִּיָּה'] },
  { letter: 'נ', words: ['נֵר', 'נַעַל', 'נָמֵר'] },
]

const youngEndingGroups = [
  { target: 'מִלָּה שֶׁמִּסְתַּיֶּמֶת בְּ-ית', word: 'בַּיִת' },
  { target: 'מִלָּה שֶׁמִּסְתַּיֶּמֶת בְּ-ון', word: 'בַּלוֹן' },
  { target: 'מִלָּה שֶׁמִּסְתַּיֶּמֶת בְּ-ים', word: 'כּוֹכָבִים' },
  { target: 'מִלָּה שֶׁמִּסְתַּיֶּמֶת בְּ-ות', word: 'מַתָּנוֹת' },
  { target: 'מִלָּה שֶׁמִּסְתַּיֶּמֶת בְּ-ר', word: 'פֶּרַח' },
  { target: 'מִלָּה שֶׁמִּסְתַּיֶּמֶת בְּ-ל', word: 'חָתוּל' },
  { target: 'מִלָּה שֶׁמִּסְתַּיֶּמֶת בְּ-ה', word: 'מִטָּה' },
  { target: 'מִלָּה שֶׁמִּסְתַּיֶּמֶת בְּ-ק', word: 'בָּצֵק' },
  { target: 'מִלָּה שֶׁמִּסְתַּיֶּמֶת בְּ-ב', word: 'זָהָב' },
  { target: 'מִלָּה שֶׁמִּסְתַּיֶּמֶת בְּ-שׁ', word: 'דְּבַשׁ' },
]

const readingCategoryThemes = [
  {
    targets: ['שֵׁם שֶׁל חַיָּה', 'שֵׁם שֶׁל מַאֲכָל', 'שֵׁם שֶׁל בֶּגֶד'],
    items: ['כֶּלֶב', 'מָרָק', 'מְעִיל'],
  },
  {
    targets: ['שֵׁם שֶׁל צֶבַע', 'שֵׁם שֶׁל כְּלִי תַּחְבּוּרָה', 'שֵׁם שֶׁל כְּלִי בַּיִת'],
    items: ['יָרֹק', 'אוֹטוֹבּוּס', 'שֻׁלְחָן'],
  },
  {
    targets: ['מִלָּה בְּיָחִיד', 'מִלָּה בְּרַבִּים', 'פֹּעַל'],
    items: ['יַלְדָּה', 'סְפָרִים', 'רוֹצָה'],
  },
  {
    targets: ['כּוֹתֶרֶת', 'שְׁאֵלָה', 'תְּשׁוּבָה'],
    items: ['הַטִּיּוּל לַיַּעַר', 'מָתַי יָצָאנוּ?', 'יָצָאנוּ בַּבֹּקֶר'],
  },
  {
    targets: ['הַתְחָלָה', 'אֶמְצַע', 'סוֹף'],
    items: ['הִלְבַּשְׁנוּ תִּיקִים', 'הִגַּעְנוּ לַגַּן', 'חָזַרְנוּ הַבַּיְתָה'],
  },
  {
    targets: ['שֵׁם עֶצֶם', 'תֹּאַר', 'פֹּעַל'],
    items: ['כִּסֵּא', 'מָתוֹק', 'קוֹפֵץ'],
  },
  {
    targets: ['שֵׁם שֶׁל צֶמַח', 'שֵׁם שֶׁל רֶגֶשׁ', 'שֵׁם שֶׁל מָקוֹם'],
    items: ['פֶּרַח', 'שִׂמְחָה', 'גַּן'],
  },
  {
    targets: ['שֵׁם שֶׁל פְּרִי', 'שֵׁם שֶׁל כְּלִי כְּתִיבָה', 'שֵׁם שֶׁל חַיָּה'],
    items: ['אֲגַס', 'עִפָּרוֹן', 'אַרְנָב'],
  },
  {
    targets: ['דְּמוּת', 'מָקוֹם', 'זְמַן'],
    items: ['נוֹעָה', 'בַּסִּפְרִיָּה', 'אַחֲרֵי הַצָּהֳרַיִם'],
  },
  {
    targets: ['הַתְחָלָה', 'בְּעָיָה', 'פִּתְרוֹן'],
    items: ['יָצָאנוּ לַטִּיּוּל', 'הִתְחִיל גֶּשֶׁם', 'נִכְנַסְנוּ לַמִּבְנֶה'],
  },
  {
    targets: ['שְׁאֵלָה', 'תְּשׁוּבָה', 'סִימַן שְׁאֵלָה'],
    items: ['אֵיפֹה הַתִּיק', 'הַתִּיק עַל הַכִּסֵּא', '?'],
  },
  {
    targets: ['שֵׁם עֶצֶם', 'פֹּעַל', 'תֹּאַר'],
    items: ['חַלּוֹן', 'רוֹקֵד', 'מָהִיר'],
  },
]

const advancedReadingThemes = [
  {
    targets: ['פֵּרוּשׁ: חָכָם', 'פֵּרוּשׁ: מָהִיר', 'פֵּרוּשׁ: יָפֶה'],
    items: ['נָבוֹן', 'זָרִיז', 'נָאֶה'],
  },
  {
    targets: ['רַעְיוֹן מֶרְכָּזִי', 'פְּרָט תּוֹמֵךְ', 'מַסְקָנָה'],
    items: ['שְׁמִירָה עַל מַיִם חֲשׁוּבָה', 'סְגִירַת הַבֶּרֶז חוֹסֶכֶת מַיִם', 'כְּדַאי לְהִזָּהֵר מִבִּזְבּוּז'],
  },
  {
    targets: ['טַעֲנָה', 'דֻּגְמָה', 'נִמּוּק'],
    items: ['רָצוּי לִקְרֹא כָּל יוֹם', 'יֶלֶד שֶׁקּוֹרֵא מַכִּיר יוֹתֵר מִלִּים', 'לְמָשָׁל קְרִיאָה לִפְנֵי הַשֵּׁנָה'],
  },
  {
    targets: ['מַטָּרַת טֶקְסְט מֵידָעִי', 'מַטָּרַת סִפּוּר', 'מַטָּרַת הוֹרָאָה'],
    items: ['לְלַמֵּד עוּבְדוֹת', 'לְסַפֵּר עַל דְּמוּיוֹת וְאִירוּעִים', 'לְהַסְבִּיר מַה לַעֲשׂוֹת'],
  },
  {
    targets: ['סִיבָּה', 'תּוֹצָאָה', 'פִּתְרוֹן'],
    items: ['הַשְּׁבִיל הָיָה חָלָק', 'הַיְלָדִים לָכְדוּ לְאַט', 'הֵם נָעֲלוּ נַעֲלַיִם מַתְאִימוֹת'],
  },
  {
    targets: ['מִלָּה בַּמַּשְׁמָעוּת "שֶׁקֶט"', 'מִלָּה בַּמַּשְׁמָעוּת "שָׂמֵחַ"', 'מִלָּה בַּמַּשְׁמָעוּת "גָּדוֹל"'],
    items: ['נָח', 'עָלִיז', 'רָחָב'],
  },
  {
    targets: ['עֻבְדָּה', 'דֵּעָה', 'נִמּוּק'],
    items: ['הַסִּפְרִיָּה נִפְתַּחַת בְּשָׁעָה שְׁמוֹנֶה', 'לְדַעְתִּי סִפְרִיָּה הִיא מָקוֹם נָעִים מְאֹד', 'כִּי יֵשׁ בָּהּ שֶׁקֶט וּסְפָרִים רַבִּים'],
  },
  {
    targets: ['מִי?', 'אֵיפֹה?', 'לָמָּה?'],
    items: ['הַמַּדְרִיךְ', 'בַּשְּׁבִיל הַיָּרֹק', 'כְּדֵי לְהַגִּיעַ לַמַּעְיָן'],
  },
  {
    targets: ['כּוֹתֶרֶת מַתְאִימָה', 'פְּרָט מְסַיֵּעַ', 'מַסְקָנָה'],
    items: ['הַכַּדּוּר הֶחָדָשׁ שֶׁל יַעֵל', 'יַעֵל שִׂיחֲקָה בַּחָצֵר כָּל הַבּוֹקֶר', 'הַכַּדּוּר שִׂמַּח אוֹתָהּ'],
  },
  {
    targets: ['דְּמוּת רָאשִׁית', 'בְּעָיָה', 'פִּתְרוֹן'],
    items: ['דָּנִי', 'הַתִּיק נֶעֱלַם', 'הֵם מָצְאוּ אוֹתוֹ לְיַד הַסַּפְסָל'],
  },
  {
    targets: ['הוֹרָאָה רִאשׁוֹנָה', 'הוֹרָאָה שְׁנִיָּה', 'הוֹרָאָה שְׁלִישִׁית'],
    items: ['שִׁטְפוּ אֶת הַיָּדַיִם', 'יַבְּשׁוּ בַּמַּגֶּבֶת', 'סִגְרוּ אֶת הַבֶּרֶז'],
  },
  {
    targets: ['מִלָּה נִרְדֶּפֶת לְ-"קָטָן"', 'מִלָּה נִרְדֶּפֶת לְ-"אַמִּיץ"', 'מִלָּה נִרְדֶּפֶת לְ-"מָהִיר"'],
    items: ['זָעִיר', 'גִּבּוֹר', 'זָרִיז'],
  },
]

const englishVocabulary = [
  { word: 'cat', meaning: 'חָתוּל', emoji: '🐱', minAge: 4 },
  { word: 'dog', meaning: 'כֶּלֶב', emoji: '🐶', minAge: 4 },
  { word: 'sun', meaning: 'שֶׁמֶשׁ', emoji: '☀️', minAge: 4 },
  { word: 'ball', meaning: 'כַּדּוּר', emoji: '⚽', minAge: 4 },
  { word: 'red', meaning: 'אָדֹם', emoji: '🟥', minAge: 4 },
  { word: 'blue', meaning: 'כָּחֹל', emoji: '🟦', minAge: 4 },
  { word: 'apple', meaning: 'תַּפּוּחַ', emoji: '🍎', minAge: 4 },
  { word: 'water', meaning: 'מַיִם', emoji: '💧', minAge: 4 },
  { word: 'fish', meaning: 'דָּג', emoji: '🐟', minAge: 4 },
  { word: 'car', meaning: 'מְכוֹנִית', emoji: '🚗', minAge: 4 },
  { word: 'green', meaning: 'יָרֹק', emoji: '🟩', minAge: 4 },
  { word: 'book', meaning: 'סֵפֶר', emoji: '📘', minAge: 5 },
  { word: 'milk', meaning: 'חָלָב', emoji: '🥛', minAge: 5 },
  { word: 'tree', meaning: 'עֵץ', emoji: '🌳', minAge: 5 },
  { word: 'bird', meaning: 'צִפּוֹר', emoji: '🐦', minAge: 5 },
  { word: 'flower', meaning: 'פֶּרַח', emoji: '🌼', minAge: 5 },
  { word: 'duck', meaning: 'בַּרְוָז', emoji: '🦆', minAge: 5 },
  { word: 'star', meaning: 'כּוֹכָב', emoji: '⭐', minAge: 5 },
  { word: 'house', meaning: 'בַּיִת', emoji: '🏠', minAge: 5 },
  { word: 'school', meaning: 'בֵּית סֵפֶר', emoji: '🏫', minAge: 6 },
  { word: 'chair', meaning: 'כִּסֵּא', emoji: '🪑', minAge: 6 },
  { word: 'table', meaning: 'שֻׁלְחָן', emoji: '🪵', minAge: 6 },
  { word: 'door', meaning: 'דֶּלֶת', emoji: '🚪', minAge: 6 },
  { word: 'pencil', meaning: 'עִפָּרוֹן', emoji: '✏️', minAge: 6 },
  { word: 'bag', meaning: 'תִּיק', emoji: '🎒', minAge: 6 },
  { word: 'happy', meaning: 'שָׂמֵחַ', emoji: '😊', minAge: 7 },
  { word: 'family', meaning: 'מִשְׁפָּחָה', emoji: '👨‍👩‍👧', minAge: 7 },
  { word: 'friend', meaning: 'חָבֵר', emoji: '🧡', minAge: 7 },
  { word: 'garden', meaning: 'גִּנָּה', emoji: '🌷', minAge: 7 },
  { word: 'jump', meaning: 'לִקְפֹּץ', emoji: '🤸', minAge: 7 },
  { word: 'yellow', meaning: 'צָהֹב', emoji: '🟨', minAge: 8 },
  { word: 'window', meaning: 'חַלּוֹן', emoji: '🪟', minAge: 8 },
  { word: 'clock', meaning: 'שָׁעוֹן', emoji: '🕒', minAge: 8 },
  { word: 'river', meaning: 'נָהָר', emoji: '🏞️', minAge: 8 },
  { word: 'question', meaning: 'שְׁאֵלָה', emoji: '❓', minAge: 8 },
  { word: 'breakfast', meaning: 'אֲרוּחַת בֹּקֶר', emoji: '🥣', minAge: 10 },
  { word: 'library', meaning: 'סִפְרִיָּה', emoji: '📚', minAge: 10 },
  { word: 'careful', meaning: 'זָהִיר', emoji: '🧠', minAge: 10 },
  { word: 'board', meaning: 'לוּחַ', emoji: '🧾', minAge: 10 },
  { word: 'notebook', meaning: 'מַחְבֶּרֶת', emoji: '📓', minAge: 10 },
  { word: 'bridge', meaning: 'גֶּשֶׁר', emoji: '🌉', minAge: 11 },
  { word: 'planet', meaning: 'כּוֹכַב לֶכֶת', emoji: '🪐', minAge: 11 },
  { word: 'museum', meaning: 'מוּזֵאוֹן', emoji: '🏛️', minAge: 11 },
  { word: 'journey', meaning: 'מַסָּע', emoji: '🧭', minAge: 12 },
  { word: 'discover', meaning: 'לְגַלּוֹת', emoji: '🔎', minAge: 12 },
  { word: 'protect', meaning: 'לְהַגֵּן', emoji: '🛡️', minAge: 12 },
  { word: 'solution', meaning: 'פִּתְרוֹן', emoji: '💡', minAge: 13 },
  { word: 'pattern', meaning: 'תַּבְנִית', emoji: '🧩', minAge: 13 },
  { word: 'measure', meaning: 'לִמְדֹּד', emoji: '📏', minAge: 13 },
]

const englishSentenceFrames = [
  { sentence: 'The cat is ___.', options: ['small', 'book', 'milk', 'tree'], answer: 'small', minAge: 8 },
  { sentence: 'I drink ___.', options: ['milk', 'chair', 'sun', 'bird'], answer: 'milk', minAge: 8 },
  { sentence: 'I see a ___ in the sky.', options: ['bird', 'table', 'milk', 'door'], answer: 'bird', minAge: 8 },
  { sentence: 'Open the ___.', options: ['door', 'apple', 'clock', 'garden'], answer: 'door', minAge: 8 },
  { sentence: 'The ball is ___.', options: ['red', 'chair', 'tree', 'library'], answer: 'red', minAge: 8 },
  { sentence: 'My ___ is in the classroom.', options: ['bag', 'river', 'planet', 'bridge'], answer: 'bag', minAge: 8 },
  { sentence: 'We read in the ___.', options: ['library', 'apple', 'yellow', 'rain'], answer: 'library', minAge: 10 },
  { sentence: 'The children ___ to school every day.', options: ['go', 'blue', 'window', 'happy'], answer: 'go', minAge: 10 },
  { sentence: 'Put the book on the ___.', options: ['table', 'sun', 'flower', 'river'], answer: 'table', minAge: 10 },
  { sentence: 'The teacher writes on the ___.', options: ['board', 'duck', 'juice', 'garden'], answer: 'board', minAge: 10 },
  { sentence: 'My notebook is in the ___.', options: ['bag', 'planet', 'milk', 'bridge'], answer: 'bag', minAge: 10 },
  { sentence: 'A planet moves in ___.', options: ['space', 'soup', 'shirt', 'garden'], answer: 'space', minAge: 11 },
  { sentence: 'You should be ___ near the road.', options: ['careful', 'banana', 'purple', 'pencil'], answer: 'careful', minAge: 11 },
  { sentence: 'The bridge is over the ___.', options: ['river', 'plate', 'chair', 'bag'], answer: 'river', minAge: 11 },
  { sentence: 'We visited the ___.', options: ['museum', 'milk', 'tree', 'duck'], answer: 'museum', minAge: 11 },
  { sentence: 'They ___ a new path on the map.', options: ['discover', 'yellow', 'table', 'flower'], answer: 'discover', minAge: 12 },
  { sentence: 'Our class went on a long ___.', options: ['journey', 'window', 'green', 'plate'], answer: 'journey', minAge: 12 },
  { sentence: 'We must ___ the small animals.', options: ['protect', 'window', 'yellow', 'chair'], answer: 'protect', minAge: 12 },
  { sentence: 'The team will ___ a hidden cave.', options: ['discover', 'orange', 'pencil', 'cloud'], answer: 'discover', minAge: 12 },
  { sentence: 'Look for the number ___.', options: ['pattern', 'banana', 'milk', 'duck'], answer: 'pattern', minAge: 13 },
  { sentence: 'We need a good ___ for the problem.', options: ['solution', 'window', 'garden', 'chair'], answer: 'solution', minAge: 13 },
  { sentence: 'Use the ruler to ___ the line.', options: ['measure', 'flower', 'purple', 'sleep'], answer: 'measure', minAge: 13 },
]

const youngLogicThemes = [
  [
    ['גָּדוֹל', 'קָטָן'],
    ['חַם', 'קַר'],
    ['פָּתוּחַ', 'סָגוּר'],
    ['יוֹם', 'לַיְלָה'],
  ],
  [
    ['לְמַעְלָה', 'לְמַטָּה'],
    ['מָלֵא', 'רֵיק'],
    ['מָהִיר', 'אִטִּי'],
    ['רָחוֹק', 'קָרוֹב'],
  ],
  [
    ['יָבֵשׁ', 'רָטוֹב'],
    ['שָׂמֵחַ', 'עָצוּב'],
    ['כָּבֵד', 'קַל'],
    ['קָצָר', 'אָרֹךְ'],
  ],
  [
    ['עִגּוּל', 'אֵין לוֹ צְלָעוֹת'],
    ['מְשֻׁלָּשׁ', '3 צְלָעוֹת'],
    ['מְרֻבָּע', '4 צְלָעוֹת'],
    ['מַלְבֵּן', '4 צְלָעוֹת וּשְׁתֵּי צוּרוֹת אֹרֶךְ'],
  ],
  [
    ['כַּפִּית', 'מָרָק'],
    ['מַבְרֶשֶׁת', 'שֵׂעָר'],
    ['מַחְבָּרֶת', 'כְּתִיבָה'],
    ['מַטְעֵן', 'סוֹלְלָה'],
  ],
]

const advancedLogicThemes = [
  [
    ['מֶרְכַּז הַכִּיתָּה', 'מָקוֹם בָּאֶמְצַע'],
    ['מְחוּמָּשׁ', '5 צְלָעוֹת'],
    ['תַּבְנִית עוֹלָה', 'גְּדֵלָה כָּל פַּעַם'],
    ['תַּבְנִית יוֹרֶדֶת', 'קְטֵנָה כָּל פַּעַם'],
  ],
  [
    ['שׁוֹרֶשׁ', 'חֵלֶק שֶׁל מִלָּה'],
    ['כּוֹתֶרֶת', 'שֵׁם קָצָר לַטֶּקְסְט'],
    ['טַעֲנָה', 'דֵּעָה שֶׁצָּרִיךְ לְבַסֵּס'],
    ['מַסְקָנָה', 'מַה שֶׁמְּבִינִים בַּסּוֹף'],
  ],
  [
    ['2, 4, 6', 'עוֹלֶה בְּ-2'],
    ['5, 10, 15', 'עוֹלֶה בְּ-5'],
    ['12, 9, 6', 'יוֹרֵד בְּ-3'],
    ['20, 30, 40', 'עוֹלֶה בְּ-10'],
  ],
  [
    ['חֵצִי', '1/2'],
    ['רֶבַע', '1/4'],
    ['אָחוּזִים', 'חֶלֶק מִתּוֹךְ 100'],
    ['יַחַס', 'הַשְׁוָאָה בֵּין כַּמּוּיוֹת'],
  ],
  [
    ['כּוֹכַב לֶכֶת', 'נַעַ בַּמַּעְרֶכֶת'],
    ['מַפָּה', 'מַצִּיגָה מַסְלוּל'],
    ['הוֹרָאָה', 'מַסְבִּירָה מַה לַעֲשׂוֹת'],
    ['מֵידָע', 'עוּבְדוֹת עַל נוֹשֵׂא'],
  ],
  [
    ['הֶקֵּף', 'סְכוּם כָּל הַצְּלָעוֹת'],
    ['שֶׁטַח', 'כַּמָּה מָקוֹם יֵשׁ בִּפְנִים'],
    ['כֶּפֶל', 'חִבּוּר חוֹזֵר'],
    ['חִלּוּק', 'פֵּרוּק לִקְבוּצוֹת שָׁווֹת'],
  ],
  [
    ['דֵּעָה', 'מַה שֶׁמִּישֶׁהוּ חוֹשֵׁב'],
    ['עֻבְדָּה', 'מַה שֶׁאֶפְשָׁר לִבְדֹּק'],
    ['נִמּוּק', 'הֶסְבֵּר לַטַּעֲנָה'],
    ['דֻּגְמָה', 'מַקְרֶה שֶׁמַּרְאֶה אֶת הָרַעְיוֹן'],
  ],
  [
    ['סֵדֶר עוֹלֶה', 'מִן הַקָּטָן לַגָּדוֹל'],
    ['סֵדֶר יוֹרֵד', 'מִן הַגָּדוֹל לַקָּטָן'],
    ['זָוִית יְשָׁרָה', '90 מַעֲלוֹת'],
    ['מַקְבִּילִים', 'לֹא נִפְגָּשִׁים'],
  ],
  [
    ['גּוּף הַשְּׁאֵלָה', 'מַה שֶׁצָּרִיךְ לִפְתֹּר'],
    ['מִלַּת קִשּׁוּר', 'מְחַבֶּרֶת בֵּין רַעְיוֹנוֹת'],
    ['כּוֹתֶרֶת מַתְאִימָה', 'מְסַכֶּמֶת אֶת הַנּוֹשֵׂא'],
    ['מִלָּה נִרְדֶּפֶת', 'מִלָּה דּוֹמָה בַּמַּשְׁמָעוּת'],
  ],
  [
    ['מַצְפֵּן', 'מַרְאֶה כִּוּוּנִים'],
    ['מִקְרָא מַפָּה', 'מַסְבִּיר סִימָּנִים'],
    ['קְנֵה מִדָּה', 'מַרְאֶה מֶרְחָק עַל מַפָּה'],
    ['נְקֻדַּת הַתְחָלָה', 'מֵאַיִן מַתְחִילִים'],
  ],
]

const memoryPrimaryThemes = [
  [
    ['חָתוּל', '🐱'],
    ['כֶּלֶב', '🐶'],
    ['צִפּוֹר', '🐦'],
    ['דָּג', '🐟'],
    ['סוּס', '🐴'],
    ['פַּרְפַּר', '🦋'],
  ],
  [
    ['תַּפּוּחַ', '🍎'],
    ['בָּנָנָה', '🍌'],
    ['אֲגַס', '🍐'],
    ['עֲנָבִים', '🍇'],
    ['תּוּת', '🍓'],
    ['אֲבַטִּיחַ', '🍉'],
  ],
  [
    ['שֶׁמֶשׁ', '☀️'],
    ['עָנָן', '☁️'],
    ['גֶּשֶׁם', '🌧️'],
    ['קֶשֶׁת', '🌈'],
    ['רַעַם', '⚡'],
    ['שֶׁלֶג', '❄️'],
  ],
  [
    ['כַּדּוּר', '⚽'],
    ['בּוּבָּה', '🧸'],
    ['חֵלֶק פָּאזֶל', '🧩'],
    ['סֵפֶר', '📘'],
    ['מִכְחוֹל', '🖌️'],
    ['חֲלוּלִית', '🎺'],
  ],
  [
    ['כִּסֵּא', '🪑'],
    ['שֻׁלְחָן', '🪵'],
    ['חַלּוֹן', '🪟'],
    ['דֶּלֶת', '🚪'],
    ['מְנוֹרָה', '💡'],
    ['מִטָּה', '🛏️'],
  ],
  [
    ['אוֹטוֹ', '🚗'],
    ['אוֹטוֹבּוּס', '🚌'],
    ['רַכֶּבֶת', '🚆'],
    ['אֳנִיָּה', '🚢'],
    ['אֹפַנַּיִם', '🚲'],
    ['מָטוֹס', '✈️'],
  ],
]

const memorySecondaryThemes = [
  [
    ['יוֹם רִאשׁוֹן', '1️⃣'],
    ['יוֹם שֵׁנִי', '2️⃣'],
    ['יוֹם שְׁלִישִׁי', '3️⃣'],
    ['יוֹם רְבִיעִי', '4️⃣'],
    ['יוֹם חֲמִישִׁי', '5️⃣'],
    ['יוֹם שִׁשִּׁי', '6️⃣'],
    ['שַׁבָּת', '7️⃣'],
    ['סוֹף שָׁבוּעַ', '🎉'],
  ],
  [
    ['מְשֻׁלָּשׁ', '🔺'],
    ['מְרֻבָּע', '⬜'],
    ['מַלְבֵּן', '▭'],
    ['עִגּוּל', '⚪'],
    ['חָמֵשׁ צְלָעוֹת', '⬟'],
    ['שֵׁשׁ צְלָעוֹת', '⬢'],
    ['כּוֹכָב', '⭐'],
    ['לֵב', '💗'],
  ],
  [
    ['קָרָא', '📖'],
    ['כָּתַב', '✍️'],
    ['צִיֵּר', '🎨'],
    ['שִׂיחֵק', '🎲'],
    ['קָפַץ', '🤸'],
    ['שָׁר', '🎵'],
    ['בָּנָה', '🧱'],
    ['חָשַׁב', '💭'],
  ],
  [
    ['שֹׁרֶשׁ', '🌱'],
    ['גֶּזַע', '🪵'],
    ['עָלֶה', '🍃'],
    ['פֶּרַח', '🌼'],
    ['פְּרִי', '🍎'],
    ['זֶרַע', '🌰'],
    ['עֵץ', '🌳'],
    ['יַעַר', '🌲'],
  ],
  [
    ['שָׁלוֹם', '👋'],
    ['בְּבַקָּשָׁה', '🙏'],
    ['תּוֹדָה', '💐'],
    ['סְלִיחָה', '🤝'],
    ['בֹּקֶר טוֹב', '🌅'],
    ['לַיְלָה טוֹב', '🌙'],
    ['הַצְלָחָה', '🏆'],
    ['חֲבֵרוּת', '🧡'],
  ],
  [
    ['מַדָּע', '🔬'],
    ['חֶשְׁבּוֹן', '🧮'],
    ['קְרִיאָה', '📚'],
    ['אַנְגְּלִית', '🔤'],
    ['מוּסִיקָה', '🎼'],
    ['סְפּוֹרְט', '🏃'],
    ['אָמָּנוּת', '🖍️'],
    ['מַחְשֵׁב', '💻'],
  ],
  [
    ['שִׂמְחָה', '😊'],
    ['עֶצֶב', '😢'],
    ['הַפְתָּעָה', '😮'],
    ['פַּחַד', '😨'],
    ['גַּאֲוָה', '😌'],
    ['סַקְרָנוּת', '🤔'],
    ['רֹגַע', '😌'],
    ['הִתְרַגְּשׁוּת', '🤩'],
  ],
]

const stageSpecs = [
  {
    id: 'forest-numbers-001',
    worldId: 'forest-of-numbers',
    missionId: 'forest-bloom',
    title: 'שְׁבִיל הַזְּרָעִים',
    instructions: 'קוֹרְאִים, סוֹפְרִים אוֹ פּוֹתְרִים, וּבוֹחֲרִים אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.',
    subject: 'math',
    difficultyByAge: primaryDifficultyByAge,
    rewardBase: { xp: 30, coins: 12, badgeId: 'math-sprout' },
    generator: generateMathPrimaryActivities,
  },
  {
    id: 'forest-numbers-002',
    worldId: 'forest-of-numbers',
    missionId: 'forest-echo',
    title: 'צְלִילֵי הַסְּפִירָה',
    instructions: 'מְגַלִּים אֶת הַחֹק, פּוֹתְרִים בְּעָיָה קְצָרָה וּבוֹחֲרִים תְּשׁוּבָה אַחַת נְכוֹנָה.',
    subject: 'math',
    difficultyByAge: secondaryDifficultyByAge,
    rewardBase: { xp: 38, coins: 15, badgeId: 'math-sprout' },
    generator: generateMathSecondaryActivities,
  },
  {
    id: 'castle-reading-001',
    worldId: 'castle-of-reading',
    missionId: 'castle-gate',
    title: 'מַפְתֵּחַ הָאוֹתִיּוֹת',
    instructions: 'גוֹרְרִים כָּל מִלָּה, מֻשָּׂג אוֹ מִשְׁפָּט לַמָּקוֹם הַמַּתְאִים לוֹ.',
    subject: 'reading',
    difficultyByAge: primaryDifficultyByAge,
    rewardBase: { xp: 35, coins: 14, badgeId: 'story-key' },
    generator: generateReadingPrimaryActivities,
  },
  {
    id: 'castle-reading-002',
    worldId: 'castle-of-reading',
    missionId: 'castle-library',
    title: 'סִפְרִיַּת הַחֲרוּזִים',
    instructions: 'קוֹרְאִים בִּזְהִירוּת וּמְשַׁיְּכִים כָּל פְּרִיט לַקְּבוּצָה אוֹ לַתַּפְקִיד הַנָּכוֹן.',
    subject: 'reading',
    difficultyByAge: secondaryDifficultyByAge,
    rewardBase: { xp: 42, coins: 16, badgeId: 'story-key' },
    generator: generateReadingSecondaryActivities,
  },
  {
    id: 'space-english-001',
    worldId: 'space-english',
    missionId: 'space-docking',
    title: 'תַּחֲנַת עֲגִינָה',
    instructions: 'מַקְשִׁיבִים לַמִּלָּה אוֹ קוֹרְאִים אוֹתָהּ, וּבוֹחֲרִים אֶת הַמַּשְׁמָעוּת הַנְּכוֹנָה.',
    subject: 'english',
    difficultyByAge: primaryDifficultyByAge,
    rewardBase: { xp: 34, coins: 13, badgeId: 'space-reader' },
    generator: generateEnglishPrimaryActivities,
  },
  {
    id: 'space-english-002',
    worldId: 'space-english',
    missionId: 'space-comet',
    title: 'מֶרְדַּף שָׁבִיט',
    instructions: 'מַשְׁלִימִים מִלָּה, מְבִינִים מִשְׁפָּט קָצָר וּבוֹחֲרִים בַּתְּשׁוּבָה הַנְּכוֹנָה.',
    subject: 'english',
    difficultyByAge: secondaryDifficultyByAge,
    rewardBase: { xp: 40, coins: 15, badgeId: 'space-reader' },
    generator: generateEnglishSecondaryActivities,
  },
  {
    id: 'logic-cave-001',
    worldId: 'logic-cave',
    missionId: 'logic-crystals',
    title: 'קְרִיסְטָלִים תּוֹאֲמִים',
    instructions: 'מְחַפְּשִׂים אֵיךְ שְׁנֵי חֲלָקִים קְשׁוּרִים אֶחָד לַשֵּׁנִי וּמְחַבְּרִים בֵּינֵיהֶם.',
    subject: 'logic',
    difficultyByAge: primaryDifficultyByAge,
    rewardBase: { xp: 36, coins: 14, badgeId: 'logic-light' },
    generator: generateLogicPrimaryActivities,
  },
  {
    id: 'logic-cave-002',
    worldId: 'logic-cave',
    missionId: 'logic-echo',
    title: 'הֵדִים בַּמְּעָרָה',
    instructions: 'בּוֹדְקִים חֹק, יַחַס אוֹ מַשְׁמָעוּת וּמְצַמְּדִים כָּל פְּרִיט לְזוּגוֹ הַנָּכוֹן.',
    subject: 'logic',
    difficultyByAge: secondaryDifficultyByAge,
    rewardBase: { xp: 44, coins: 17, badgeId: 'logic-light' },
    generator: generateLogicSecondaryActivities,
  },
  {
    id: 'memory-island-001',
    worldId: 'memory-island',
    missionId: 'memory-shells',
    title: 'צְדָפִים זוֹהֲרִים',
    instructions: 'פוֹתְחִים קְלָפִים, זוֹכְרִים אֵיפֹה רָאִינוּ כָּל פְּרִיט וּמְחַפְּשִׂים זוּגוֹת.',
    subject: 'memory',
    difficultyByAge: primaryDifficultyByAge,
    rewardBase: { xp: 32, coins: 13, badgeId: 'memory-shell' },
    generator: generateMemoryPrimaryActivities,
  },
  {
    id: 'memory-island-002',
    worldId: 'memory-island',
    missionId: 'memory-parade',
    title: 'מִצְעַד הַצְּבָעִים',
    instructions: 'מִתְרַכְּזִים, זוֹכְרִים יָפֶה יוֹתֵר וּמְצַמְּדִים זוּגוֹת בְּלִי לְהִתְבַּלְבֵּל.',
    subject: 'memory',
    difficultyByAge: secondaryDifficultyByAge,
    rewardBase: { xp: 39, coins: 15, badgeId: 'memory-shell' },
    generator: generateMemorySecondaryActivities,
  },
]

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const levelsRoot = path.resolve(scriptDir, '../public/levels')
const ageLevelsRoot = path.join(levelsRoot, 'ages')
const advancedLevelsRoot = path.join(levelsRoot, 'advanced')

function stripNikud(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC')
}

const plainWordFixes = new Map([
  ['מלה', 'מילה'],
  ['מלים', 'מילים'],
  ['משג', 'מושג'],
  ['משגים', 'מושגים'],
  ['פרוש', 'פירוש'],
  ['פרושו', 'פירושו'],
  ['חבור', 'חיבור'],
  ['להזהר', 'להיזהר'],
  ['שרש', 'שורש'],
  ['חק', 'חוק'],
  ['כתה', 'כיתה'],
  ['מחמש', 'מחומש'],
  ['תבנה', 'תבנית'],
  ['השואה', 'השוואה'],
  ['ארוע', 'אירוע'],
  ['ארועים', 'אירועים'],
  ['מאד', 'מאוד'],
  ['אדם', 'אדום'],
  ['כחל', 'כחול'],
  ['ירק', 'ירוק'],
  ['צפור', 'ציפור'],
  ['ברוז', 'ברווז'],
  ['בקר', 'בוקר'],
  ['כסא', 'כיסא'],
  ['שלחן', 'שולחן'],
  ['עפרון', 'עיפרון'],
  ['גנה', 'גינה'],
  ['ספריה', 'ספרייה'],
  ['לקפץ', 'לקפוץ'],
])

function fixPlainWord(word) {
  const directFix = plainWordFixes.get(word)
  if (directFix) {
    return directFix
  }

  for (let prefixLength = Math.min(3, word.length - 1); prefixLength >= 1; prefixLength -= 1) {
    const prefix = word.slice(0, prefixLength)
    const base = word.slice(prefixLength)
    if (!/^[והבכלמש]{1,3}$/u.test(prefix)) {
      continue
    }

    const fixedBase = plainWordFixes.get(base)
    if (fixedBase) {
      return `${prefix}${fixedBase}`
    }
  }

  return word
}

function toPlainText(value) {
  return stripNikud(value).replace(/[\u05D0-\u05EA\u05BE\u05F3\u05F4]+/gu, (word) => fixPlainWord(word))
}

function textForAge(age, value) {
  return age < 10 ? value : toPlainText(value)
}

function transformTextTreeForDisplayAge(value, displayAge) {
  if (typeof value === 'string') {
    return textForAge(displayAge, value)
  }

  if (Array.isArray(value)) {
    return value.map((entry) => transformTextTreeForDisplayAge(entry, displayAge))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, transformTextTreeForDisplayAge(entry, displayAge)]),
    )
  }

  return value
}

function formatCountNoun(age, count, item) {
  return textForAge(age, count === 1 ? item.singular : item.plural)
}

function formatCountLabel(age, count, item) {
  return `${count} ${formatCountNoun(age, count, item)}`
}

function makeUniqueNumberOptions(seedValues, correct, minimum = 1) {
  const uniqueOptions = []
  const seen = new Set()

  const pushIfValid = (value) => {
    if (!Number.isFinite(value) || value < minimum || seen.has(value)) {
      return
    }

    seen.add(value)
    uniqueOptions.push(value)
  }

  seedValues.forEach(pushIfValid)

  let fallback = Math.max(minimum, correct + 1)
  while (uniqueOptions.length < 4) {
    pushIfValid(fallback)
    fallback += 1
  }

  return uniqueOptions.slice(0, 4)
}

function cyclePick(list, index) {
  return list[index % list.length]
}

function makeOption(id, label, emoji) {
  return {
    id,
    label,
    ...(emoji ? { emoji } : {}),
  }
}

function resolveStandardContentAge(displayAge) {
  return Math.max(minimumContentAge, displayAge - 1)
}

function resolveAdvancedContentAge(displayAge) {
  return Math.min(maximumContentAge, displayAge + 1)
}

function joinTeachingSentences(age, sentences) {
  return textForAge(
    age,
    sentences
      .filter(Boolean)
      .map((sentence) => sentence.trim())
      .join(' '),
  )
}

function explainCounting(age, count, item) {
  return joinTeachingSentences(age, [
    `סוֹפְרִים לְאַט אֶחָד אֶחָד אֶת הַ-${item.plural}.`,
    `כְּשֶׁמַּגִּיעִים לְ-${count}, עוֹצְרִים וּבוֹדְקִים שֶׁלֹּא פָּסַחְנוּ עַל שׁוּם פְּרִיט.`,
    `לָכֵן הַקְּבוּצָה הַנְּכוֹנָה הִיא זוֹ שֶׁיֵּשׁ בָּהּ בְּדִיּוּק ${formatCountLabel(age, count, item)}.`,
  ])
}

function explainComparison(age, left, right, correct, mode) {
  const smaller = Math.min(left, right)
  const larger = Math.max(left, right)
  return joinTeachingSentences(age, [
    `מַשְׁוִים בֵּין ${left} לְ-${right}.`,
    mode === 'larger'
      ? `${larger} גָּדוֹל יוֹתֵר כִּי הוּא בָּא אַחֲרֵי ${smaller} בַּסְּפִירָה.`
      : `${smaller} קָטָן יוֹתֵר כִּי הוּא בָּא לִפְנֵי ${larger} בַּסְּפִירָה.`,
    `לָכֵן הַתְּשׁוּבָה הַנְּכוֹנָה הִיא ${correct}.`,
  ])
}

function explainAddition(age, left, right, correct) {
  return joinTeachingSentences(age, [
    `מְחַבְּרִים אֶת ${left} וְאֶת ${right}.`,
    `אֶפְשָׁר לִסְפֹּר ${left} וְעוֹד ${right}, אוֹ לְהַמְשִׁיךְ מִ-${left} עוֹד ${right} צְעָדִים.`,
    `${left} + ${right} = ${correct}, וְלָכֵן זוֹ הַתְּשׁוּבָה הַנְּכוֹנָה.`,
  ])
}

function explainSubtraction(age, left, right, correct) {
  return joinTeachingSentences(age, [
    `מַתְחִילִים מִ-${left} וּמַחְסִירִים ${right}.`,
    `אֶפְשָׁר לִסְפֹּר אָחוֹרָה ${right} צְעָדִים אוֹ לְהוֹרִיד ${right} פְּרִיטִים.`,
    `${left} - ${right} = ${correct}, וְלָכֵן זוֹ הַתְּשׁוּבָה הַנְּכוֹנָה.`,
  ])
}

function explainPlaceValue(age, tens, ones, correct) {
  return joinTeachingSentences(age, [
    `${tens} עֲשָׂרוֹת הֵן ${tens * 10}.`,
    `מוֹסִיפִים עוֹד ${ones} אַחָדוֹת.`,
    `${tens * 10} + ${ones} = ${correct}, וְלָכֵן הַמִּסְפָּר הַנָּכוֹן הוּא ${correct}.`,
  ])
}

function explainGroupsTotal(age, groups, each, correct) {
  return joinTeachingSentences(age, [
    `יֵשׁ ${groups} קְבוּצוֹת, וּבְכָל קְבוּצָה יֵשׁ ${each}.`,
    `מְחַבְּרִים ${each} עוֹד ${each} ${groups} פְּעָמִים, אוֹ כּוֹתְבִים ${groups} × ${each}.`,
    `${groups} × ${each} = ${correct}, וְלָכֵן בַּסַּךְ הַכֹּל יֵשׁ ${correct}.`,
  ])
}

function explainMultiplication(age, left, right, correct) {
  return joinTeachingSentences(age, [
    `כֶּפֶל הוּא חִבּוּר חוֹזֵר.`,
    `${left} × ${right} פֵּרוּשׁוֹ ${left} קְבוּצוֹת שֶׁל ${right} אוֹ ${right} קְבוּצוֹת שֶׁל ${left}.`,
    `כְּשֶׁמְּחַבְּרִים אוֹ כּוֹפְלִים מְקַבְּלִים ${correct}, וְזוֹ הַתְּשׁוּבָה הַנְּכוֹנָה.`,
  ])
}

function explainDivision(age, total, groups, correct) {
  const remainder = total % groups
  const wholePart = total - remainder
  const wholeQuotient = wholePart / groups
  const remainderQuotient = remainder === 0 ? 0 : remainder / groups

  if (remainder === 0) {
    return joinTeachingSentences(age, [
      `מְחַלְּקִים אֶת ${total} לְ-${groups} קְבוּצוֹת שָׁווֹת.`,
      `אֶפְשָׁר לִבְדֹּק בְּעֶזְרַת כֶּפֶל הָפוּךְ: אִם בְּכָל קְבוּצָה יֵשׁ ${correct}, אָז ${correct} × ${groups} = ${total}.`,
      `לָכֵן ${total} ÷ ${groups} = ${correct}, וּבְכָל קְבוּצָה יֵשׁ ${correct}.`,
    ])
  }

  return joinTeachingSentences(age, [
    `מְחַלְּקִים אֶת ${total} לְ-${groups} קְבוּצוֹת שָׁווֹת.`,
    `קוֹדֶם מְחַלְּקִים אֶת ${wholePart} לְ-${groups}, וּמְקַבְּלִים ${wholeQuotient}.`,
    `אַחַר כָּךְ מְחַלְּקִים גַּם אֶת הַשְּׁאֵרִית ${remainder} לְ-${groups}, וּמְקַבְּלִים ${remainderQuotient}.`,
    `מְחַבְּרִים ${wholeQuotient} וְ-${remainderQuotient}, וּמְקַבְּלִים ${correct}. לָכֵן בְּכָל קְבוּצָה יֵשׁ ${correct}.`,
  ])
}

function explainFractionName(age, label, numerator, denominator) {
  return joinTeachingSentences(age, [
    `מִסְתַּכְּלִים עַל הַמּוֹנֶה וְעַל הַמְּכַנֶּה.`,
    `הַמּוֹנֶה ${numerator} אוֹמֵר כַּמָּה חֲלָקִים לָקַחְנוּ, וְהַמְּכַנֶּה ${denominator} אוֹמֵר לְכַמָּה חֲלָקִים חִלַּקְנוּ אֶת הַשָּׁלֵם.`,
    `לָכֵן הַכְּתִיבָה הַנְּכוֹנָה הִיא ${label}.`,
  ])
}

function explainSequence(age, values, step, correct) {
  return joinTeachingSentences(age, [
    `בּוֹדְקִים מָה קוֹרֶה בֵּין הַמִּסְפָּרִים ${values.join(', ')}.`,
    `כָּאן מוֹסִיפִים כָּל פַּעַם ${step}.`,
    `לָכֵן לַמִּסְפָּר הָאַחֲרוֹן מוֹסִיפִים ${step} וּמְקַבְּלִים ${correct}.`,
  ])
}

function explainPartOfWhole(age, total, denominator, correct) {
  return joinTeachingSentences(age, [
    `כְּדֵי לִמְצֹא חֵלֶק מִתּוֹךְ כָּל הַכַּמּוּת, מְחַלְּקִים אֶת ${total} לְ-${denominator} חֲלָקִים שָׁוִים.`,
    `${total} ÷ ${denominator} = ${correct}.`,
    `לָכֵן זֶהוּ הַחֵלֶק הַנָּכוֹן.`,
  ])
}

function explainDecimalConversion(age, fraction, decimal) {
  return joinTeachingSentences(age, [
    `מְחַפְּשִׂים אֵיזֶה מִסְפָּר עֶשְׂרוֹנִי מַתְאִים לַשֶּׁבֶר ${fraction}.`,
    `כְּשֶׁמְּמִירִים אֶת הַשֶּׁבֶר לְמִסְפָּר עֶשְׂרוֹנִי, מְקַבְּלִים ${decimal}.`,
    `לָכֵן זוֹ הַתְּשׁוּבָה הַנְּכוֹנָה.`,
  ])
}

function explainPerimeter(age, width, height, correct) {
  return joinTeachingSentences(age, [
    `הֶקֵּף הוּא סְכוּם כָּל הַצְּלָעוֹת שֶׁל הַמַּלְבֵּן.`,
    `מְחַבְּרִים אֹרֶךְ וְרוֹחַב, וְאַחַר כָּךְ כּוֹפְלִים בְּ-2: (${width} + ${height}) × 2.`,
    `הַתּוֹצָאָה הִיא ${correct}, וְלָכֵן זֶהוּ הַהֶקֵּף.`,
  ])
}

function explainArea(age, width, height, correct) {
  return joinTeachingSentences(age, [
    `שֶׁטַח שֶׁל מַלְבֵּן מוֹצְאִים עַל יְדֵי כֶּפֶל.`,
    `כּוֹפְלִים אֹרֶךְ בְּרוֹחַב: ${width} × ${height}.`,
    `מְקַבְּלִים ${correct}, וְלָכֵן זֶהוּ הַשֶּׁטַח.`,
  ])
}

function explainPercent(age, percent, base, correct) {
  return joinTeachingSentences(age, [
    `אָחוּז פֵּרוּשׁוֹ חֵלֶק מִתּוֹךְ 100.`,
    `הוֹפְכִים אֶת ${percent}% לְ-${percent}/100 וּמְכַפְּלִים בְּ-${base}.`,
    `מְקַבְּלִים ${correct}, וְלָכֵן זוֹ הַתְּשׁוּבָה הַנְּכוֹנָה.`,
  ])
}

function explainDiscount(age, price, discount, correct) {
  const discountValue = (price * discount) / 100
  return joinTeachingSentences(age, [
    `קוֹדֶם מוֹצְאִים כַּמָּה שָׁוָה הַהֲנָחָה שֶׁל ${discount}%.`,
    `${discount}% מִתּוֹךְ ${price} הוּא ${discountValue}.`,
    `עוֹד מוֹרִידִים ${discountValue} מִ-${price} וּמְקַבְּלִים ${correct}.`,
  ])
}

function explainEquation(age, addend, target, solution) {
  return joinTeachingSentences(age, [
    `כְּדֵי לִמְצֹא אֶת x, צָרִיךְ לְהַשְׁאִיר אֶת x לְבַדּוֹ.`,
    `מְחַסְּרִים ${addend} מִשְּׁנֵי הַצְּדָדִים: ${target} - ${addend} = ${solution}.`,
    `לָכֵן x = ${solution}.`,
  ])
}

function explainDoubleEquation(age, right, target, solution) {
  return joinTeachingSentences(age, [
    `קוֹדֶם מְחַסְּרִים ${right} כְּדֵי לְהַשְׁאִיר רַק 2x.`,
    `${target} - ${right} מַשְׁאִיר 2x, וְאַחַר כָּךְ מְחַלְּקִים בְּ-2.`,
    `מְקַבְּלִים x = ${solution}, וְלָכֵן זוֹ הַתְּשׁוּבָה הַנְּכוֹנָה.`,
  ])
}

function explainRatio(age, ratioLeft, ratioRight, target, correct) {
  return joinTeachingSentences(age, [
    `בּוֹדְקִים פִּי כַּמָּה גָּדַל הַחֵלֶק הַיְּמָנִי: מִ-${ratioRight} לְ-${target}.`,
    `אוֹתוֹ הַכֶּפֶל צָרִיךְ לַעֲשׂוֹת גַּם בַּחֵלֶק הַשְּׂמָאלִי.`,
    `לָכֵן מִ-${ratioLeft} מַגִּיעִים לְ-${correct}, וְזוֹ הַתְּשׁוּבָה.`,
  ])
}

function createMultipleChoiceHints(age, prompt, explanation) {
  return [
    {
      step: 1,
      title: textForAge(age, 'קוֹדֶם מְבִינִים מַה מְחַפְּשִׂים'),
      body: joinTeachingSentences(age, [prompt, 'מַדְגִּישִׁים בְּרֹאשׁ אִם צָרִיךְ לִסְפֹּר, לְחַבֵּר, לְחַסֵּר, לְהַשְׁווֹת אוֹ לְהַתְאִים.']),
    },
    {
      step: 2,
      title: textForAge(age, 'פּוֹתְרִים לְאַט וּפוֹסְלִים תְּשׁוּבוֹת לֹא מַתְאִימוֹת'),
      body: textForAge(age, 'מְחַשְּׁבִים אוֹ בּוֹדְקִים צַעַד אַחַר צַעַד, וּמַסִּירִים אֶפְשָׁרוּיוֹת שֶׁלֹּא מַתְאִימוֹת לַשְּׁאֵלָה.'),
    },
    {
      step: 3,
      title: textForAge(age, 'כָּכָה מַגִּיעִים לַתְּשׁוּבָה'),
      body: explanation,
    },
  ]
}

function createDragAndDropHints(age, prompt, explanation) {
  return [
    {
      step: 1,
      title: textForAge(age, 'קוֹרְאִים אֶת כָּל הַמִּלִּים אוֹ הַפְּרִיטִים'),
      body: joinTeachingSentences(age, [prompt, 'כְּדַאי לְהַתְחִיל מִפְּרִיט אֶחָד שֶׁאֲנַחְנוּ מְבִינִים בְּוַדָּאוּת.']),
    },
    {
      step: 2,
      title: textForAge(age, 'בוֹדְקִים מַה מְחַבֵּר בֵּין הַפְּרִיט לַקְּבוּצָה'),
      body: textForAge(age, 'שׁוֹאֲלִים אֶת עַצְמֵנוּ: בְּאֵיזוֹ אוֹת הַמִּלָּה מַתְחִילָה, לְאֵיזֶה סִיּוּם הִיא שַׁיֶּכֶת, אוֹ מָה הַתַּפְקִיד שֶׁלָּהּ.'),
    },
    {
      step: 3,
      title: textForAge(age, 'אַחַר כָּךְ מְאַמְּתִים'),
      body: explanation,
    },
  ]
}

function createMatchPairsHints(age, prompt, explanation) {
  return [
    {
      step: 1,
      title: textForAge(age, 'קוֹרְאִים אֶת שְׁנֵי הַצְּדָדִים'),
      body: joinTeachingSentences(age, [prompt, 'מִתְחִילִים מִזּוּג אֶחָד שֶׁהַקֶּשֶׁר בּוֹ הֲכִי בָּרוּר.']),
    },
    {
      step: 2,
      title: textForAge(age, 'שׁוֹאֲלִים מַה הַקֶּשֶׁר'),
      body: textForAge(age, 'הַאִם זֶה הֶפֶךְ? הַאִם זֹאת הַגְדָּרָה? הַאִם זֶה חֵלֶק וְתַפְקִיד? כְּשֶׁמְּבִינִים אֶת הַקֶּשֶׁר, הַזּוּג נַעֲשֶׂה בָּרוּר.'),
    },
    {
      step: 3,
      title: textForAge(age, 'בּוֹדְקִים שֶׁכָּל זֶה מִתְאִים'),
      body: explanation,
    },
  ]
}

function createMemoryHints(age, prompt, explanation) {
  return [
    {
      step: 1,
      title: textForAge(age, 'מִסְתַּכְּלִים טוֹב טוֹב'),
      body: joinTeachingSentences(age, [prompt, 'כְּשֶׁפּוֹתְחִים קֶלֶף, שָׂמִים לֵב גַּם לַמָּקוֹם וְגַם לַנּוֹשֵׂא.']),
    },
    {
      step: 2,
      title: textForAge(age, 'זוֹכְרִים מָקוֹם וְנוֹשֵׂא'),
      body: textForAge(age, 'מְנַסִּים לִזְכֹּר לְיַד אֵיזֶה צֶבַע, בְּאֵיזֶה צַד אוֹ בְּאֵיזֶה אֵזוֹר רָאִינוּ אֶת הַקֶּלֶף.'),
    },
    {
      step: 3,
      title: textForAge(age, 'מְחַזְּרִים לַמָּקוֹם הַנָּכוֹן'),
      body: explanation,
    },
  ]
}

function createMultipleChoiceActivity(age, stageId, index, difficulty, prompt, question, options, correctIndex, explanation) {
  const mappedOptions = options.map((option, optionIndex) =>
    makeOption(
      `option-${optionIndex + 1}`,
      typeof option === 'string' ? option : option.label,
      typeof option === 'string' ? undefined : option.emoji,
    ),
  )

  return {
    id: `${stageId}-q${String(index + 1).padStart(2, '0')}`,
    type: 'multiple_choice',
    difficulty,
    hints: createMultipleChoiceHints(age, prompt, explanation),
    content: {
      prompt,
      question,
      options: mappedOptions,
      correctOptionId: mappedOptions[correctIndex].id,
      explanation,
    },
  }
}

function createDragAndDropActivity(age, stageId, index, difficulty, prompt, items, targets, explanation) {
  return {
    id: `${stageId}-q${String(index + 1).padStart(2, '0')}`,
    type: 'drag_and_drop',
    difficulty,
    hints: createDragAndDropHints(age, prompt, explanation),
    content: {
      prompt,
      items: items.map((item, itemIndex) => ({
        id: `item-${itemIndex + 1}`,
        label: item.label,
      })),
      targets: targets.map((target, targetIndex) => ({
        id: `target-${targetIndex + 1}`,
        label: target.label,
        accepts: [`item-${target.matchIndex + 1}`],
      })),
      explanation,
    },
  }
}

function createMatchPairsActivity(age, stageId, index, difficulty, prompt, pairs, explanation) {
  return {
    id: `${stageId}-q${String(index + 1).padStart(2, '0')}`,
    type: 'match_pairs',
    difficulty,
    hints: createMatchPairsHints(age, prompt, explanation),
    content: {
      prompt,
      pairs: pairs.map((pair, pairIndex) => ({
        id: `pair-${pairIndex + 1}`,
        left: pair[0],
        right: pair[1],
      })),
      explanation,
    },
  }
}

function createMemoryActivity(age, stageId, index, difficulty, prompt, pairs, explanation) {
  return {
    id: `${stageId}-q${String(index + 1).padStart(2, '0')}`,
    type: 'memory_cards',
    difficulty,
    hints: createMemoryHints(age, prompt, explanation),
    content: {
      prompt,
      pairs: pairs.map((pair, pairIndex) => ({
        id: `pair-${pairIndex + 1}`,
        label: pair[0],
        emoji: pair[1],
      })),
      explanation,
    },
  }
}

function makeNumericDistractors(correct, spread = 2) {
  return [correct - spread, correct - 1, correct, correct + 1].map((value, index, array) => {
    const fallback = correct + index + 2
    return value > 0 && !array.slice(0, index).includes(value) ? value : fallback
  })
}

function generateMathPrimaryActivities(displayAge, contentAge, stageSpec) {
  const age = displayAge
  const difficulty = stageSpec.difficultyByAge[contentAge]
  const profile = ageProfiles[contentAge]
  const activities = []

  for (let index = 0; index < activitiesPerStage; index += 1) {
    const item = cyclePick(commonObjects, index)

    if (contentAge === 3) {
      if (index < 10) {
        const correct = 1 + (index % 4)
        const options = makeUniqueNumberOptions(
          [correct, Math.min(5, correct + 1), Math.max(1, correct - 1), Math.min(6, correct + 2)],
          correct,
        )
        const correctIndex = options.indexOf(correct)
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `אֵיזוֹ קְבוּצָה יֵשׁ בָּהּ ${correct}?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַקְּבוּצָה הַמְּדֻיֶּקֶת.'),
            options.map((count) => ({ label: formatCountLabel(age, count, item), emoji: item.emoji })),
            correctIndex,
            explainCounting(age, correct, item),
          ),
        )
        continue
      }

      if (index < 20) {
        const left = 1 + (index % 4)
        const right = left + 1
        const askLarger = index % 2 === 0
        const correct = askLarger ? right : left
        const options = makeUniqueNumberOptions([left, right, Math.min(6, right + 1), 1], correct)
        const correctIndex = options.indexOf(correct)
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, askLarger ? 'אֵיזֶה מִסְפָּר גָּדוֹל יוֹתֵר?' : 'אֵיזֶה מִסְפָּר קָטָן יוֹתֵר?'),
            textForAge(age, `${left} אוֹ ${right}?`),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            correctIndex,
            explainComparison(age, left, right, correct, askLarger ? 'larger' : 'smaller'),
          ),
        )
        continue
      }

      const promptByShapeIndex = [
        textForAge(age, 'אֵיזוֹ צוּרָה מְתַגְלְגֶּלֶת?'),
        textForAge(age, 'אֵיזוֹ צוּרָה יֵשׁ לָהּ 3 צְלָעוֹת?'),
        textForAge(age, 'אֵיזוֹ צוּרָה יֵשׁ לָהּ 4 צְלָעוֹת שָׁווֹת?'),
        textForAge(age, 'אֵיזוֹ צוּרָה נִרְאֵית כְּמוֹ דֶּלֶת?'),
      ]
      const explanationByShapeIndex = [
        textForAge(age, 'מַחְפְּשִׂים צוּרָה בְּלִי פִּנּוֹת. רַק עִגּוּל מִתְגַּלְגֵּל כִּי אֵין לוֹ צְלָעוֹת.'),
        textForAge(age, 'סוֹפְרִים צְלָעוֹת. לִמְשֻׁלָּשׁ יֵשׁ בְּדִיּוּק 3 צְלָעוֹת.'),
        textForAge(age, 'סוֹפְרִים 4 צְלָעוֹת וּבוֹדְקִים שֶׁכֻּלָּן שָׁווֹת. כָּךְ יוֹדְעִים שֶׁזֶּה מְרֻבָּע.'),
        textForAge(age, 'מַלְבֵּן נִרְאֶה כְּמוֹ דֶּלֶת כִּי יֵשׁ לוֹ צוּרָה אָרֻכָּה וְאַרְבַּע צְלָעוֹת.'),
      ]
      const correctIndex = index % shapeOptions.length
      activities.push(
        createMultipleChoiceActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          promptByShapeIndex[correctIndex],
          textForAge(age, 'בַּחֲרוּ אֶת הַצּוּרָה הַנְּכוֹנָה.'),
          shapeOptions,
          correctIndex,
          explanationByShapeIndex[correctIndex],
        ),
      )
      continue
    }

    if (contentAge <= 5) {
      if (index < 10) {
        const correct = 3 + (index % Math.max(4, profile.mathPrimaryMax - 2))
        const numericOptions = makeNumericDistractors(correct, 1)
        const correctIndex = numericOptions.indexOf(correct)
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `אֵיזוֹ קְבוּצָה מַתְאִימָה לַמִּסְפָּר ${correct}?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַקְּבוּצָה הַמְּדֻיֶּקֶת.'),
            numericOptions.map((count) => ({ label: formatCountLabel(age, count, item), emoji: item.emoji })),
            correctIndex,
            explainCounting(age, correct, item),
          ),
        )
        continue
      }

      if (index < 20) {
        const left = 2 + ((index * 2) % Math.max(4, profile.mathPrimaryMax - 1))
        const right = left + 1 + (index % 3)
        const askLarger = index % 2 === 0
        const correct = askLarger ? right : left
        const options = makeUniqueNumberOptions([left, right, right + 2, Math.max(1, left - 1)], correct)
        const correctIndex = options.indexOf(correct)
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, askLarger ? `אֵיזֶה מִסְפָּר גָּדוֹל יוֹתֵר?` : 'אֵיזֶה מִסְפָּר קָטָן יוֹתֵר?'),
            textForAge(age, `${left} אוֹ ${right}?`),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            correctIndex,
            explainComparison(age, left, right, correct, askLarger ? 'larger' : 'smaller'),
          ),
        )
        continue
      }

      const correctIndex = index % shapeOptions.length
      const correctShape = shapeOptions[correctIndex]
      const prompts = [
        textForAge(age, 'אֵיזוֹ צוּרָה מְתַגְלְגֶּלֶת?'),
        textForAge(age, 'אֵיזוֹ צוּרָה יֵשׁ לָהּ 3 צְלָעוֹת?'),
        textForAge(age, 'אֵיזוֹ צוּרָה יֵשׁ לָהּ 4 צְלָעוֹת שָׁווֹת?'),
        textForAge(age, 'אֵיזוֹ צוּרָה נִרְאֵית כְּמוֹ דֶּלֶת?'),
      ]
      const explanations = [
        textForAge(age, 'עִגּוּל מִתְגַּלְגֵּל כִּי אֵין לוֹ פִּנּוֹת.'),
        textForAge(age, 'מְשֻׁלָּשׁ יֵשׁ לוֹ 3 צְלָעוֹת.'),
        textForAge(age, 'מְרֻבָּע יֵשׁ לוֹ 4 צְלָעוֹת שָׁווֹת.'),
        textForAge(age, 'מַלְבֵּן דּוֹמֶה לְדֶלֶת בַּצּוּרָה שֶׁלּוֹ.'),
      ]
      activities.push(
        createMultipleChoiceActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          prompts[correctIndex],
          textForAge(age, 'בַּחֲרוּ אֶת הַצּוּרָה הַנְּכוֹנָה.'),
          shapeOptions,
          correctIndex,
          explanations[correctIndex],
        ),
      )
      continue
    }

    if (contentAge === 6) {
      if (index < 10) {
        const left = 4 + (index % 7)
        const right = 3 + ((index + 2) % 6)
        const correct = left + right
        const options = makeNumericDistractors(correct, 2)
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מָה הַתְּשׁוּבָה לְ-${left} + ${right}?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַמִּסְפָּר הַנָּכוֹן.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            options.indexOf(correct),
            explainAddition(age, left, right, correct),
          ),
        )
      } else if (index < 20) {
        const left = 10 + (index % 9)
        const right = 1 + (index % 6)
        const correct = left - right
        const options = makeNumericDistractors(correct, 2)
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מָה הַתְּשׁוּבָה לְ-${left} - ${right}?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַמִּסְפָּר הַנָּכוֹן.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            options.indexOf(correct),
            explainSubtraction(age, left, right, correct),
          ),
        )
      } else {
        const tens = 1 + (index % 4)
        const ones = (index * 3) % 10
        const correct = tens * 10 + ones
        const options = [correct, correct + 1, correct + 10, tens * 10 + ((ones + 2) % 10)]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `בְּאֵיזֶה מִסְפָּר יֵשׁ ${tens} עֲשָׂרוֹת וְ-${ones} אַחָדוֹת?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַמִּסְפָּר הַנָּכוֹן.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            0,
            explainPlaceValue(age, tens, ones, correct),
          ),
        )
      }
      continue
    }

    if (contentAge === 7) {
      if (index < 10) {
        const left = 24 + index * 3
        const right = 11 + (index % 8)
        const correct = left + right
        const options = [correct - 10, correct, correct + 1, correct + 10]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מָה הַתְּשׁוּבָה לְ-${left} + ${right}?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            1,
            explainAddition(age, left, right, correct),
          ),
        )
      } else if (index < 20) {
        const left = 58 + index
        const right = 12 + (index % 9)
        const correct = left - right
        const options = [correct - 1, correct, correct + 10, correct + 2]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מָה הַתְּשׁוּבָה לְ-${left} - ${right}?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            1,
            explainSubtraction(age, left, right, correct),
          ),
        )
      } else {
        const groups = 2 + (index % 4)
        const each = 3 + (index % 5)
        const correct = groups * each
        const options = [correct, correct + each, correct - 1, correct + 2]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `יֵשׁ ${groups} קְבוּצוֹת שֶׁל ${each}. כַּמָּה יֵשׁ בַּסַּךְ הַכֹּל?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.'),
            options.map((value) => ({ label: String(value), emoji: '🧮' })),
            0,
            explainGroupsTotal(age, groups, each, correct),
          ),
        )
      }
      continue
    }

    if (contentAge === 8 || contentAge === 9) {
      if (index < 10) {
        const left = 2 + (index % 5)
        const right = 3 + ((index + 1) % 4)
        const correct = left * right
        const options = [correct - right, correct, correct + right, correct + 1]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מָה הַתְּשׁוּבָה לְ-${left} × ${right}?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.'),
            options.map((value) => ({ label: String(value), emoji: '🧮' })),
            1,
            explainMultiplication(age, left, right, correct),
          ),
        )
      } else if (index < 20) {
        const total = 20 + (index % 6) * 4
        const groups = 2 + (index % 4)
        const correct = total / groups
        const options = [correct, correct + 1, correct + 2, correct + 3]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `${total} חֲלָקִים מִתְחַלְּקִים לְ-${groups} קְבוּצוֹת שָׁווֹת. כַּמָּה בְּכָל קְבוּצָה?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            0,
            explainDivision(age, total, groups, correct),
          ),
        )
      } else {
        const numerator = index % 2 === 0 ? 1 : 3
        const denominator = index % 2 === 0 ? 2 : 4
        const correct = `${numerator}/${denominator}`
        const options = [
          { label: correct, emoji: '🍰' },
          { label: `${numerator}/${denominator + 1}`, emoji: '🍰' },
          { label: `${numerator + 1}/${denominator}`, emoji: '🍰' },
          { label: `1/${denominator}`, emoji: '🍰' },
        ]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, numerator === 1 ? 'אֵיךְ כּוֹתְבִים חֵצִי אוֹ רֶבַע?' : 'אֵיךְ כּוֹתְבִים שְׁלֹשָׁה רְבָעִים?'),
            textForAge(age, 'בַּחֲרוּ אֶת הַשֶּׁבֶר הַנָּכוֹן.'),
            options,
            0,
            explainFractionName(age, correct, numerator, denominator),
          ),
        )
      }
      continue
    }

    if (contentAge === 10) {
      if (index < 10) {
        const fractions = [
          ['1/2', '0.5'],
          ['1/4', '0.25'],
          ['3/4', '0.75'],
          ['1/10', '0.1'],
        ]
        const pair = cyclePick(fractions, index)
        const options = [pair[1], `${Number(pair[1]) + 0.1}`, `${Number(pair[1]) + 0.25}`, `${Number(pair[1]) + 0.5}`]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `איזה מספר עשרוני שווה ל-${pair[0]}?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: value, emoji: '🧮' })),
            0,
            explainDecimalConversion(age, pair[0], pair[1]),
          ),
        )
      } else if (index < 20) {
        const left = 12 + index
        const right = 4 + (index % 6)
        const correct = left * right
        const options = [correct, correct + right, correct - left, correct + 10]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מה התשובה ל-${left} × ${right}?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            0,
            explainMultiplication(age, left, right, correct),
          ),
        )
      } else {
        const width = 4 + (index % 5)
        const height = 6 + (index % 4)
        const correct = 2 * (width + height)
        const options = [correct, width * height, correct + 2, correct - 2]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מה ההיקף של מלבן שאורכו ${width} ורוחבו ${height}?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: String(value), emoji: '📏' })),
            0,
            explainPerimeter(age, width, height, correct),
          ),
        )
      }
      continue
    }

    if (contentAge === 11) {
      if (index < 10) {
        const denominator = 4 + (index % 3) * 2
        const left = 1 + (index % 2)
        const right = 2 + (index % 3)
        const correct = `${left + right}/${denominator}`
        const options = [correct, `${left + right + 1}/${denominator}`, `${right}/${denominator}`, `${left}/${denominator}`]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `כמה הם ${left}/${denominator} + ${right}/${denominator}?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: value, emoji: '🧮' })),
            0,
            joinTeachingSentences(age, [
              'כְּשֶׁהַמְּכַנִּים שָׁוִים, מְחַבְּרִים רַק אֶת הַמּוֹנִים.',
              `${left} + ${right} = ${left + right}, וְהַמְּכַנֶּה נִשְׁאָר ${denominator}.`,
              `לָכֵן הַתְּשׁוּבָה הִיא ${correct}.`,
            ]),
          ),
        )
      } else if (index < 20) {
        const percent = 10 + (index % 7) * 10
        const base = 100 + (index % 5) * 50
        const correct = (percent / 100) * base
        const options = [correct, correct + 10, correct - 10, correct + 20]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `כמה הם ${percent}% מתוך ${base}?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: String(value), emoji: '📊' })),
            0,
            explainPercent(age, percent, base, correct),
          ),
        )
      } else {
        const width = 5 + (index % 5)
        const height = 3 + (index % 4)
        const correct = width * height
        const options = [correct, correct + width, correct + height, width + height]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מה השטח של מלבן שאורכו ${width} ורוחבו ${height}?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: String(value), emoji: '📐' })),
            0,
            explainArea(age, width, height, correct),
          ),
        )
      }
      continue
    }

    if (index < 10) {
      const left = -4 + (index % 5)
      const right = 3 + (index % 4)
      const correct = left + right
      const options = [correct, correct + 1, correct - 1, right - left]
      activities.push(
        createMultipleChoiceActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, `מה התשובה ל-${left} + ${right}?`),
          textForAge(age, 'בחרו את התשובה הנכונה.'),
          options.map((value) => ({ label: String(value), emoji: '🔢' })),
          0,
          explainAddition(age, left, right, correct),
        ),
      )
    } else if (index < 20) {
      const solution = 3 + (index % 6)
      const addend = 2 + (index % 5)
      const target = solution + addend
      const options = [solution, solution + 1, solution - 1, addend]
      activities.push(
        createMultipleChoiceActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, `מהו x אם x + ${addend} = ${target}?`),
          textForAge(age, 'בחרו את התשובה הנכונה.'),
          options.map((value) => ({ label: String(value), emoji: '🧮' })),
          0,
          explainEquation(age, addend, target, solution),
        ),
      )
    } else {
      const ratioLeft = 2 + (index % 4)
      const ratioRight = 3 + (index % 5)
      const multiplier = 2 + (index % 3)
      const target = ratioRight * multiplier
      const correct = ratioLeft * multiplier
      const options = [correct, correct + ratioLeft, correct - 1, correct + 2]
      activities.push(
        createMultipleChoiceActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, `אם היחס הוא ${ratioLeft}:${ratioRight} והחלק הימני הוא ${target}, מהו החלק השמאלי?`),
          textForAge(age, 'בחרו את התשובה הנכונה.'),
          options.map((value) => ({ label: String(value), emoji: '📏' })),
          0,
          explainRatio(age, ratioLeft, ratioRight, target, correct),
        ),
      )
    }
  }

  return activities
}

function generateMathSecondaryActivities(displayAge, contentAge, stageSpec) {
  const age = displayAge
  const difficulty = stageSpec.difficultyByAge[contentAge]
  const activities = []

  for (let index = 0; index < activitiesPerStage; index += 1) {
    if (contentAge === 3) {
      if (index < 15) {
        const start = 1 + (index % 3)
        const step = 1
        const values = [start, start + step, start + step * 2]
        const correct = start + step * 3
        const options = [correct, correct + 1, Math.max(1, correct - 1), correct + 2]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `אֵיזֶה מִסְפָּר מַמְשִׁיךְ אֶת הַסִּדְרָה ${values.join(', ')}, ?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַמִּסְפָּר הַבָּא.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            0,
            explainSequence(age, values, step, correct),
          ),
        )
      } else {
        const pattern = ['אָדֹם', 'כָּחֹל', 'אָדֹם']
        const options = ['כָּחֹל', 'יָרֹק', 'אָדֹם', 'צָהֹב']
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מָה בָּא אַחֲרֵי הַדֶּגֶם ${pattern.join(', ')}?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַהֶמְשֵׁךְ הַנָּכוֹן.'),
            options.map((value) => ({ label: textForAge(age, value), emoji: '🎨' })),
            0,
            textForAge(age, 'מִסְתַּכְּלִים עַל הַסֵּדֶר: אָדֹם, כָּחֹל, אָדֹם. הַצֶּבַע הַבָּא צָרִיךְ לִהְיוֹת כָּחֹל כְּדֵי שֶׁהַדֶּגֶם יִמָּשֵׁךְ.'),
          ),
        )
      }
      continue
    }

    if (contentAge <= 5) {
      if (index < 15) {
        const start = 1 + (index % 4)
        const step = 1 + (index % 2)
        const values = [start, start + step, start + step * 2]
        const correct = start + step * 3
        const options = [correct, correct + 1, correct + step, correct + 2]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `אֵיזֶה מִסְפָּר מַמְשִׁיךְ אֶת הַסִּדְרָה ${values.join(', ')}, ?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַמִּסְפָּר הַבָּא.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            0,
            explainSequence(age, values, step, correct),
          ),
        )
      } else {
        const colors = ['אָדֹם', 'כָּחֹל', 'אָדֹם']
        const options = ['אָדֹם', 'יָרֹק', 'כָּחֹל', 'צָהֹב']
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מָה בָּא אַחֲרֵי הַדֶּגֶם ${colors.join(', ')}?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַהֶמְשֵׁךְ הַנָּכוֹן.'),
            options.map((value) => ({ label: textForAge(age, value), emoji: '🎨' })),
            1,
            textForAge(age, 'מִסְתַּכְּלִים עַל הַדֶּגֶם: אָדֹם, כָּחֹל, אָדֹם. הוּא חוֹזֵר אָדֹם, כָּחֹל, וְלָכֵן הַהֶמְשֵׁךְ הוּא כָּחֹל.'),
          ),
        )
      }
      continue
    }

    if (contentAge <= 9) {
      if (index < 10) {
        const start = 2 + (index % 4)
        const step = contentAge === 6 ? 5 : contentAge === 7 ? 2 : 3
        const values = [start, start + step, start + step * 2]
        const correct = start + step * 3
        const options = [correct, correct + step, correct - 1, correct + 2]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `אֵיזֶה מִסְפָּר מַמְשִׁיךְ אֶת הַסִּדְרָה ${values.join(', ')}, ?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַמִּסְפָּר הַבָּא.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            0,
            explainSequence(age, values, step, correct),
          ),
        )
      } else if (index < 20) {
        const apples = 10 + index
        const eaten = 2 + (index % 4)
        const correct = apples - eaten
        const options = [correct, correct + 1, correct + 2, apples + eaten]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `הָיוּ ${apples} תַּפּוּחִים. אָכְלוּ ${eaten}. כַּמָּה נִשְׁאֲרוּ?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.'),
            options.map((value) => ({ label: String(value), emoji: '🍎' })),
            0,
            explainSubtraction(age, apples, eaten, correct),
          ),
        )
      } else {
        const total = contentAge === 8 ? 24 + (index % 6) * 4 : 12 + (index % 5) * 2
        const numerator = 1
        const denominator = contentAge === 8 ? 4 : 2
        const correct = total / denominator * numerator
        const options = [correct, correct + denominator, correct - 1, correct + 2]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, denominator === 2 ? `מָה הוּא חֵצִי מִתּוֹךְ ${total}?` : `מָה הוּא רֶבַע מִתּוֹךְ ${total}?`),
            textForAge(age, 'בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.'),
            options.map((value) => ({ label: String(value), emoji: '🧮' })),
            0,
            explainPartOfWhole(age, total, denominator, correct),
          ),
        )
      }
      continue
    }

    if (contentAge === 10) {
      if (index < 10) {
        const sequenceStart = 12 + index
        const values = [sequenceStart, sequenceStart + 4, sequenceStart + 8]
        const correct = sequenceStart + 12
        const options = [correct, correct + 2, correct - 1, correct + 4]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `איזה מספר ממשיך את הסדרה ${values.join(', ')}, ?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: String(value), emoji: '🔢' })),
            0,
            explainSequence(age, values, 4, correct),
          ),
        )
      } else if (index < 20) {
        const decimal = (2.5 + (index % 5) * 0.5).toFixed(1)
        const whole = 3 + (index % 4)
        const correct = (Number(decimal) + whole).toFixed(1)
        const options = [correct, (Number(correct) + 1).toFixed(1), (Number(correct) - 0.5).toFixed(1), `${whole}`]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מה התוצאה של ${decimal} + ${whole}?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: value, emoji: '🧮' })),
            0,
            explainAddition(age, Number(decimal), whole, Number(correct)),
          ),
        )
      } else {
        const price = 20 + (index % 5) * 5
        const count = 3 + (index % 4)
        const correct = price * count
        const options = [correct, correct + price, correct - count, price + count]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `מחברת עולה ${price} שקלים. כמה עולות ${count} מחברות?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: String(value), emoji: '💰' })),
            0,
            explainMultiplication(age, price, count, correct),
          ),
        )
      }
      continue
    }

    if (contentAge === 11) {
      if (index < 10) {
        const correct = ['25%', '50%', '75%', '10%'][index % 4]
        const whole = ['1/4', '1/2', '3/4', '1/10'][index % 4]
        const options = [correct, '20%', '40%', '80%']
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `איזה אחוז שווה ל-${whole}?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: value, emoji: '📊' })),
            0,
            joinTeachingSentences(age, [
              `מְמִירִים אֶת ${whole} לְאָחוּזִים.`,
              'חוֹשְׁבִים כַּמָּה חֲלָקִים מִתּוֹךְ 100 הֵם אוֹתוֹ חֵלֶק.',
              `לָכֵן ${whole} שָׁוֶה לְ-${correct}.`,
            ]),
          ),
        )
      } else if (index < 20) {
        const width = 6 + (index % 4)
        const height = 5 + (index % 3)
        const correct = 2 * (width + height)
        const options = [correct, width * height, correct + 4, correct - 2]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `לגן מלבני יש אורך ${width} ורוחב ${height}. מה ההיקף שלו?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: String(value), emoji: '📏' })),
            0,
            explainPerimeter(age, width, height, correct),
          ),
        )
      } else {
        const price = 80 + (index % 5) * 10
        const discount = 10 + (index % 4) * 5
        const correct = price - (price * discount) / 100
        const options = [correct, correct + 5, correct - 5, price]
        activities.push(
          createMultipleChoiceActivity(
            age,
            stageSpec.id,
            index,
            difficulty,
            textForAge(age, `חולצה עולה ${price} שקלים ויש עליה הנחה של ${discount}%. מה המחיר אחרי ההנחה?`),
            textForAge(age, 'בחרו את התשובה הנכונה.'),
            options.map((value) => ({ label: String(value), emoji: '🏷️' })),
            0,
            explainDiscount(age, price, discount, correct),
          ),
        )
      }
      continue
    }

    if (index < 10) {
      const sequenceStart = -3 + index
      const values = [sequenceStart, sequenceStart + 2, sequenceStart + 4]
      const correct = sequenceStart + 6
      const options = [correct, correct - 1, correct + 1, correct + 2]
      activities.push(
        createMultipleChoiceActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, `איזה מספר ממשיך את הסדרה ${values.join(', ')}, ?`),
          textForAge(age, 'בחרו את התשובה הנכונה.'),
          options.map((value) => ({ label: String(value), emoji: '🔢' })),
          0,
          explainSequence(age, values, 2, correct),
        ),
      )
    } else if (index < 20) {
      const base = 5 + (index % 5)
      const multiplier = 3 + (index % 4)
      const correct = base * multiplier
      const options = [correct, correct + base, correct - multiplier, correct + 2]
      activities.push(
        createMultipleChoiceActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, `ביחס של 1:${base}, כמה נקבל אם נכפיל ב-${multiplier}?`),
          textForAge(age, 'בחרו את התשובה הנכונה.'),
          options.map((value) => ({ label: String(value), emoji: '📏' })),
          0,
          explainMultiplication(age, base, multiplier, correct),
        ),
      )
    } else {
      const left = 2 + (index % 4)
      const right = 3 + (index % 5)
      const target = left * 2 + right
      const correct = (target - right) / 2
      const options = [correct, correct + 1, correct - 1, right]
      activities.push(
        createMultipleChoiceActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, `אם 2x + ${right} = ${target}, מהו x?`),
          textForAge(age, 'בחרו את התשובה הנכונה.'),
          options.map((value) => ({ label: String(value), emoji: '🧮' })),
          0,
          explainDoubleEquation(age, right, target, correct),
        ),
      )
    }
  }

  return activities
}

function generateReadingPrimaryActivities(displayAge, contentAge, stageSpec) {
  const age = displayAge
  const difficulty = stageSpec.difficultyByAge[contentAge]
  const activities = []

  for (let index = 0; index < activitiesPerStage; index += 1) {
    if (contentAge === 3) {
      const groups = [cyclePick(earlyLetterGroups, index), cyclePick(earlyLetterGroups, index + 4)]
      const items = groups.map((group, itemIndex) => ({
        label: textForAge(age, group.words[itemIndex % group.words.length]),
      }))
      const targets = groups.map((group, targetIndex) => ({
        label: textForAge(age, `הָאוֹת ${group.letter}`),
        matchIndex: targetIndex,
      }))
      activities.push(
        createDragAndDropActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, 'קוֹרְאִים אֶת הַמִּלָּה וּמְחַפְּשִׂים אֵיזוֹ אוֹת שׁוֹמְעִים בַּהַתְחָלָה.'),
          items,
          targets,
          textForAge(age, 'אוֹמְרִים אֶת הַמִּלָּה בְּקוֹל. הָאוֹת הָרִאשׁוֹנָה שֶׁשּׁוֹמְעִים מְסַיַּעַת לָנוּ לִשְׁיֵּךְ אֶת הַמִּלָּה לַשַּׁעַר הַנָּכוֹן.'),
        ),
      )
      continue
    }

    if (contentAge <= 6) {
      const groups = [cyclePick(earlyLetterGroups, index), cyclePick(earlyLetterGroups, index + 3), cyclePick(earlyLetterGroups, index + 6)]
      const items = groups.map((group, itemIndex) => ({
        label: textForAge(age, group.words[itemIndex % group.words.length]),
      }))
      const targets = groups.map((group, targetIndex) => ({
        label: textForAge(age, `הָאוֹת ${group.letter}`),
        matchIndex: targetIndex,
      }))
      activities.push(
        createDragAndDropActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, 'הַתְאִימוּ כָּל מִלָּה לָאוֹת הָרִאשׁוֹנָה שֶׁלָּהּ.'),
          items,
          targets,
          textForAge(age, 'קוֹרְאִים אוֹ אוֹמְרִים אֶת הַמִּלָּה, מַקְשִׁיבִים לַצְּלִיל הָרִאשׁוֹן, וְלִפִי הוּא מַתְאִימִים לָאוֹת הַנְּכוֹנָה.'),
        ),
      )
      continue
    }

    if (contentAge <= 9) {
      const theme = cyclePick(readingCategoryThemes, index)
      const items = theme.items.map((item) => ({ label: textForAge(age, item) }))
      const targets = theme.targets.map((target, targetIndex) => ({
        label: textForAge(age, target),
        matchIndex: targetIndex,
      }))
      activities.push(
        createDragAndDropActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, 'הַתְאִימוּ כָּל פְּרִיט לַקְּבוּצָה הַנְּכוֹנָה.'),
          items,
          targets,
          textForAge(age, 'קוֹדֶם קוֹרְאִים כָּל מִלָּה. אַחַר כָּךְ חוֹשְׁבִים אִם הִיא שֵׁם, פֹּעַל, מָקוֹם אוֹ חֵלֶק שֶׁל סִפּוּר, וְלָכֵן יוֹדְעִים לְאָן לְגָרֵר אוֹתָהּ.'),
        ),
      )
      continue
    }

    const theme = cyclePick(advancedReadingThemes, index)
    const items = theme.items.map((item) => ({ label: textForAge(age, item) }))
    const targets = theme.targets.map((target, targetIndex) => ({
      label: textForAge(age, target),
      matchIndex: targetIndex,
    }))
    activities.push(
      createDragAndDropActivity(
        age,
        stageSpec.id,
        index,
        difficulty,
        textForAge(age, 'התאימו כל פריט למשמעות או לתפקיד המתאים לו.'),
        items,
        targets,
        textForAge(age, 'קוֹרְאִים אֶת הַמּוּשָּׂג אוֹ הַמִּשְׁפָּט, חוֹשְׁבִים מַה הַתַּפְקִיד שֶׁלּוֹ בַּטֶּקְסְט אוֹ מַה הַמַּשְׁמָעוּת שֶׁלּוֹ, וְאָז מַתְאִימִים לַמָּקוֹם הַנָּכוֹן.'),
      ),
    )
  }

  return activities
}

function generateReadingSecondaryActivities(displayAge, contentAge, stageSpec) {
  const age = displayAge
  const difficulty = stageSpec.difficultyByAge[contentAge]
  const activities = []

  for (let index = 0; index < activitiesPerStage; index += 1) {
    if (contentAge === 3) {
      const groups = [cyclePick(youngEndingGroups, index), cyclePick(youngEndingGroups, index + 4)]
      const items = groups.map((group) => ({ label: textForAge(age, group.word) }))
      const targets = groups.map((group, targetIndex) => ({
        label: textForAge(age, group.target),
        matchIndex: targetIndex,
      }))
      activities.push(
        createDragAndDropActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, 'מִסְתַּכְּלִים עַל סוֹף הַמִּלָּה וּבוֹחֲרִים לְאָן הִיא מַתְאִימָה.'),
          items,
          targets,
          textForAge(age, 'קוֹרְאִים אֶת סוֹף הַמִּלָּה בְּקוֹל. כְּשֶׁשּׁוֹמְעִים אֵיךְ הִיא נִגְמֶרֶת, יוֹדְעִים לְאָן לְגָרֵר אוֹתָהּ.'),
        ),
      )
      continue
    }

    if (contentAge <= 6) {
      const groups = [cyclePick(youngEndingGroups, index), cyclePick(youngEndingGroups, index + 3), cyclePick(youngEndingGroups, index + 6)]
      const items = groups.map((group) => ({ label: textForAge(age, group.word) }))
      const targets = groups.map((group, targetIndex) => ({
        label: textForAge(age, group.target),
        matchIndex: targetIndex,
      }))
      activities.push(
        createDragAndDropActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, 'הַתְאִימוּ כָּל מִלָּה לַסִּיּוּם הַמַּתְאִים לָהּ.'),
          items,
          targets,
          textForAge(age, 'מִסְתַּכְּלִים עַל הָאוֹתִיּוֹת שֶׁבְּסוֹף הַמִּלָּה, קוֹרְאִים אוֹתָן, וּלְפִי הַסִּיּוּם יוֹדְעִים לְאָן לְשַׁיֵּךְ אֶת הַמִּלָּה.'),
        ),
      )
      continue
    }

    if (contentAge <= 9) {
      const theme = cyclePick(readingCategoryThemes.slice(3), index)
      const items = theme.items.map((item) => ({ label: textForAge(age, item) }))
      const targets = theme.targets.map((target, targetIndex) => ({
        label: textForAge(age, target),
        matchIndex: targetIndex,
      }))
      activities.push(
        createDragAndDropActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, 'קִרְאוּ אֶת הַפְּרִיטִים וְהַתְאִימוּ כָּל אֶחָד לַתַּפְקִיד שֶׁלּוֹ.'),
          items,
          targets,
          textForAge(age, 'קוֹרְאִים אֶת הַפְּרִיט וְשׁוֹאֲלִים: הַאִם זֶה שֵׁם שֶׁל הַסִּפּוּר, שְׁאֵלָה, תְּשׁוּבָה אוֹ חֵלֶק מֵהַמִּבְנֶה? לְפִי זֶה מַתְאִימִים.'),
        ),
      )
      continue
    }

    const theme = cyclePick(advancedReadingThemes, index + 2)
    const items = theme.items.map((item) => ({ label: textForAge(age, item) }))
    const targets = theme.targets.map((target, targetIndex) => ({
      label: textForAge(age, target),
      matchIndex: targetIndex,
    }))
    activities.push(
      createDragAndDropActivity(
        age,
        stageSpec.id,
        index,
        difficulty,
        textForAge(age, 'קראו בזהירות והתאימו כל פריט למבנה או למשמעות הנכונה.'),
        items,
        targets,
        textForAge(age, 'קוֹדֶם מְבִינִים מַה הַפְּרִיט אוֹמֵר. אַחַר כָּךְ בּוֹדְקִים אִם הוּא רַעְיוֹן מֶרְכָּזִי, דֻּגְמָה, נִמּוּק, כּוֹתֶרֶת אוֹ חֵלֶק אַחֵר, וּמַתְאִימִים.'),
      ),
    )
  }

  return activities
}

function generateEnglishPrimaryActivities(displayAge, contentAge, stageSpec) {
  const age = displayAge
  const difficulty = stageSpec.difficultyByAge[contentAge]
  const activities = []
  const relevantWords = englishVocabulary.filter((entry) => entry.minAge <= Math.max(contentAge, 4))

  for (let index = 0; index < activitiesPerStage; index += 1) {
    const correctWord = cyclePick(relevantWords, index)
    const distractors = relevantWords.filter((entry) => entry.word !== correctWord.word).slice(index % 5, (index % 5) + 3)
    const options = [correctWord, ...distractors].slice(0, 4)
    activities.push(
      createMultipleChoiceActivity(
        age,
        stageSpec.id,
        index,
        difficulty,
        textForAge(age, `מָה הַפֵּרוּשׁ שֶׁל "${correctWord.word}"?`),
        textForAge(age, 'בַּחֲרוּ אֶת הַמַּשְׁמָעוּת הַנְּכוֹנָה.'),
        options.map((entry) => ({ label: textForAge(age, entry.meaning), emoji: entry.emoji })),
        0,
        textForAge(age, `קוֹרְאִים אֶת הַמִּלָּה "${correctWord.word}". חוֹשְׁבִים אֵיזוֹ תְּמוּנָה אוֹ מַשְׁמָעוּת מַתְאִימָה לָהּ. "${correctWord.word}" פֵּרוּשׁוֹ ${correctWord.meaning}.`),
      ),
    )
  }

  return activities
}

function generateEnglishSecondaryActivities(displayAge, contentAge, stageSpec) {
  const age = displayAge
  const difficulty = stageSpec.difficultyByAge[contentAge]
  const activities = []

  for (let index = 0; index < activitiesPerStage; index += 1) {
    if (contentAge <= 7) {
      const correctWord = cyclePick(englishVocabulary.filter((entry) => entry.minAge <= Math.max(contentAge, 4)), index + 2)
      const options = [
        { label: correctWord.word, emoji: correctWord.emoji },
        { label: cyclePick(englishVocabulary, index + 5).word, emoji: '✨' },
        { label: cyclePick(englishVocabulary, index + 8).word, emoji: '✨' },
        { label: cyclePick(englishVocabulary, index + 11).word, emoji: '✨' },
      ]
      activities.push(
        createMultipleChoiceActivity(
          age,
          stageSpec.id,
          index,
          difficulty,
          textForAge(age, `אֵיזוֹ מִלָּה בְּאַנְגְּלִית מַתְאִימָה לְ-${correctWord.meaning}?`),
          textForAge(age, 'בַּחֲרוּ אֶת הַמִּלָּה הַנְּכוֹנָה.'),
          options,
          0,
          textForAge(age, `קוֹרְאִים אֶת הַמַּשְׁמָעוּת בְּעִבְרִית וְחוֹשְׁבִים אֵיךְ אוֹמְרִים אוֹתָהּ בְּאַנְגְּלִית. ${correctWord.meaning} בְּאַנְגְּלִית הִיא "${correctWord.word}".`),
        ),
      )
      continue
    }

    const frame = cyclePick(englishSentenceFrames.filter((entry) => entry.minAge <= contentAge), index)
    activities.push(
      createMultipleChoiceActivity(
        age,
        stageSpec.id,
        index,
        difficulty,
        textForAge(age, 'קִרְאוּ אֶת הַמִּשְׁפָּט וּבַחֲרוּ אֶת הַמִּלָּה הַמַּתְאִימָה.'),
        frame.sentence,
        frame.options.map((option) => ({ label: option, emoji: '🔤' })),
        frame.options.indexOf(frame.answer),
        textForAge(age, `קוֹרְאִים אֶת כָּל הַמִּשְׁפָּט וּמְחַפְּשִׂים אֵיזוֹ מִלָּה נִשְׁמַעַת וְגוֹרֶמֶת לוֹ לִהְיוֹת הֲגִיּוֹנִי. "${frame.answer}" הִיא הַמִּלָּה שֶׁמַּשְׁלִימָה אֶת הַמִּשְׁפָּט.`),
      ),
    )
  }

  return activities
}

function generateLogicPrimaryActivities(displayAge, contentAge, stageSpec) {
  const age = displayAge
  const difficulty = stageSpec.difficultyByAge[contentAge]
  const themes = contentAge <= 8 ? youngLogicThemes : advancedLogicThemes
  const pairCount = contentAge === 3 ? 2 : 4

  return Array.from({ length: activitiesPerStage }, (_, index) => {
    const pairs = cyclePick(themes, index)
      .slice(0, pairCount)
      .map(([left, right]) => [textForAge(age, left), textForAge(age, right)])
    return createMatchPairsActivity(
      age,
      stageSpec.id,
      index,
      difficulty,
      textForAge(age, 'הַתְאִימוּ כָּל פְּרִיט לַמַּשְׁמָעוּת אוֹ לַבֵּן־זוּג הַקָּשׁוּר אֵלָיו.'),
      pairs,
      textForAge(age, 'קוֹרְאִים אֶת שְׁנֵי הַחֲלָקִים וְחוֹשְׁבִים מַה מְחַבֵּר בֵּינֵיהֶם: הֶפֶךְ, הַגְדָּרָה, תַּפְקִיד אוֹ חֹק. כְּשֶׁמְּבִינִים אֶת הַקֶּשֶׁר, קַל לְהַתְאִים.'),
    )
  })
}

function generateLogicSecondaryActivities(displayAge, contentAge, stageSpec) {
  const age = displayAge
  const difficulty = stageSpec.difficultyByAge[contentAge]
  const themes = contentAge <= 8 ? advancedLogicThemes : [...advancedLogicThemes, ...youngLogicThemes]
  const pairCount = contentAge === 3 ? 2 : 4

  return Array.from({ length: activitiesPerStage }, (_, index) => {
    const pairs = cyclePick(themes, index + 1)
      .slice(0, pairCount)
      .map(([left, right]) => [textForAge(age, left), textForAge(age, right)])
    return createMatchPairsActivity(
      age,
      stageSpec.id,
      index,
      difficulty,
      textForAge(age, 'מְחַפְּשִׂים יַחַס, חֹק אוֹ הַתְאָמָה מְדוּיֶּקֶת בֵּין כָּל שְׁנֵי חֲלָקִים.'),
      pairs,
      textForAge(age, 'מַתְחִילִים מֵהַזּוּג שֶׁהֲכִי בָּרוּר. אַחַר כָּךְ בּוֹדְקִים שֶׁכָּל שְׁאָר הַפְּרִיטִים עוֹבְדִים לְפִי אוֹתוֹ חֹק אוֹ אוֹתָהּ מַשְׁמָעוּת.'),
    )
  })
}

function generateMemoryPrimaryActivities(displayAge, contentAge, stageSpec) {
  const age = displayAge
  const difficulty = stageSpec.difficultyByAge[contentAge]
  const pairCount = ageProfiles[contentAge].memoryPrimaryPairs

  return Array.from({ length: activitiesPerStage }, (_, index) => {
    const theme = cyclePick(memoryPrimaryThemes, index)
    const pairs = theme.slice(0, pairCount).map(([label, emoji]) => [textForAge(age, label), emoji])
    return createMemoryActivity(
      age,
      stageSpec.id,
      index,
      difficulty,
      textForAge(age, 'פִּתְחוּ קְלָפִים וּמִצְאוּ אֶת כָּל הַזּוּגוֹת מֵאוֹתוֹ נוֹשֵׂא.'),
      pairs,
      textForAge(age, 'מִסְתַּכְּלִים טוֹב אֵיפֹה הִסְתַּתֵּר כָּל קֶלֶף. כְּשֶׁזוֹכְרִים אֶת הַמָּקוֹם וְאֶת הַנּוֹשֵׂא, קַל לִמְצֹא אֶת הַזּוּג.'),
    )
  })
}

function generateMemorySecondaryActivities(displayAge, contentAge, stageSpec) {
  const age = displayAge
  const difficulty = stageSpec.difficultyByAge[contentAge]
  const pairCount = ageProfiles[contentAge].memorySecondaryPairs

  return Array.from({ length: activitiesPerStage }, (_, index) => {
    const theme = cyclePick(memorySecondaryThemes, index)
    const pairs = theme.slice(0, pairCount).map(([label, emoji]) => [textForAge(age, label), emoji])
    return createMemoryActivity(
      age,
      stageSpec.id,
      index,
      difficulty,
      textForAge(age, 'זוֹכְרִים יוֹתֵר פְּרָטִים וּמְחַפְּשִׂים זוּגוֹת בֵּין קְלָפִים דּוֹמִים.'),
      pairs,
      textForAge(age, 'מַסְתִּירִים בַּזִּיכָּרוֹן אֵיפֹה רָאִינוּ כָּל קֶלֶף וּמָה הָיָה עָלָיו. כָּכָה אֶפְשָׁר לַחְזֹר לַמָּקוֹם הַנָּכוֹן וְלִסְגֹּר זוּגוֹת יוֹתֵר מַהֵר.'),
    )
  })
}

function buildStageLevel(stageSpec, displayAge, contentAge) {
  const activities = stageSpec.generator(displayAge, contentAge, stageSpec)

  if (activities.length !== activitiesPerStage) {
    throw new Error(`${stageSpec.id} בגיל תצוגה ${displayAge} נוצר עם ${activities.length} פעילויות במקום ${activitiesPerStage}.`)
  }

  return transformTextTreeForDisplayAge({
    version: 1,
    id: stageSpec.id,
    worldId: stageSpec.worldId,
    missionId: stageSpec.missionId,
    title: stageSpec.title,
    subject: stageSpec.subject,
    instructions: stageSpec.instructions,
    difficulty: stageSpec.difficultyByAge[contentAge],
    rewards: {
      xp: stageSpec.rewardBase.xp * 3,
      coins: stageSpec.rewardBase.coins * 3,
      starsPerQuestion,
      badgeId: stageSpec.rewardBase.badgeId,
    },
    completionRules: {
      passingScore: 70,
      maxMistakes: activitiesPerStage * 3,
    },
    assets: [],
    activities,
  }, displayAge)
}

async function writeStageFile(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function generateAgeLevels() {
  await rm(ageLevelsRoot, { recursive: true, force: true })
  await rm(advancedLevelsRoot, { recursive: true, force: true })
  await mkdir(ageLevelsRoot, { recursive: true })
  await mkdir(advancedLevelsRoot, { recursive: true })

  for (const displayAge of supportedAges) {
    for (const stageSpec of stageSpecs) {
      const standardPayload = buildStageLevel(stageSpec, displayAge, resolveStandardContentAge(displayAge))
      const advancedPayload = buildStageLevel(stageSpec, displayAge, resolveAdvancedContentAge(displayAge))
      const standardFilePath = path.join(ageLevelsRoot, String(displayAge), stageSpec.worldId, `${stageSpec.id}.json`)
      const advancedFilePath = path.join(advancedLevelsRoot, String(displayAge), stageSpec.worldId, `${stageSpec.id}.json`)
      await writeStageFile(standardFilePath, standardPayload)
      await writeStageFile(advancedFilePath, advancedPayload)

      if (displayAge === defaultAge) {
        await writeStageFile(path.join(levelsRoot, `${stageSpec.id}.json`), standardPayload)
      }
    }
  }
}

generateAgeLevels()
  .then(() => {
    console.log(
      `Generated ${stageSpecs.length * supportedAges.length * 2} stage files across standard and advanced tracks, with ${activitiesPerStage} activities each.`,
    )
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
