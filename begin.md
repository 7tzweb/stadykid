# מסמך פיתוח ראשי - GameKids

## מטרה
לבנות אפליקציית משחקים לימודית לילדים, cross-platform, ברמה מקצועית גבוהה, עם בסיס ארכיטקטוני נקי וסקיילבילי. האפליקציה צריכה להיות mobile-first, ידידותית לילדים, נוחה להרחבה, ומבוססת על מנוע שלבים דינמי שמריץ תוכן מתוך קבצי JSON.

## מקור עיצוב וחומר קיים
- קבצי העיצוב נמצאים בתיקייה: `/Users/tsoharzigdon/gamekids/codedisian`
- יש להשתמש בהם כהשראה וכבסיס לשפה הוויזואלית של המוצר
- כל קוד המשחק והאפליקציה צריך להיבנות בתוך: `/Users/tsoharzigdon/gamekids/g`

## החלטה טכנולוגית
הסטאק הראשי של הפרויקט:
- React
- TypeScript
- Vite
- TailwindCSS
- React Router
- Phaser 3
- Firebase Auth
- Firebase Firestore
- HTML/CSS
- JSON-based level system
- Capacitor עבור Android/iOS

הבהרה חשובה:
- React אחראי על מעטפת האפליקציה, ניתוב, מסכים, UI, אזור הורים, סטייט גלובלי וחיבורי Firebase
- Phaser 3 אחראי על מנוע המשחקים והמיני-גיימס בתוך מסך המשחק
- כל שלב במשחק צריך להיטען מ-JSON ולא להיות hard-coded בתוך קומפוננטות

## עקרונות מוצר
- ארכיטקטורה נקייה
- קומפוננטות מופרדות
- Mobile-first
- מוכן להתרחבות
- קוד reusable
- בלי שטויות מיותרות

## מטרות טכניות מרכזיות
1. לפתח את הפרויקט ברמה של מפתח senior מקצועי, מדויק ומוקפד.
2. לבנות קוד נקי, מחולק היטב לקבצים ותיקיות, עם naming איכותי וחשיבה ארכיטקטונית ברורה.
3. לבנות game engine שמריץ שלבים מתוך קבצי JSON בלבד, כך שיהיה קל לייצר שלבים חדשים גם בעזרת AI.
4. להגדיר schema ברור, קשיח ומדויק לכל סוג שלב.
5. לתמוך לפחות בסוגי השלבים הבאים:
   - `multiple_choice`
   - `drag_and_drop`
   - `match_pairs`
   - `memory_cards`
6. להפריד בצורה ברורה בין:
   - engine
   - UI
   - assets
   - level parser
   - validators
   - game logic
   - services
7. להוסיף validation ל-JSON של השלבים כדי למנוע שגיאות תוכן והרצה.
8. להכין בסיס שמוכן להתרחבות עתידית לעולמות, משחקים, משימות וסוגי שלבים חדשים.
9. לחבר Firebase עבור התחברות, שמירת התקדמות, פרופילי ילדים, מטבעות, XP ותוכן רלוונטי.
10. לשמור תיעוד עבודה מתמשך בתוך `history.md`.

## מבנה אפליקציה כללי
האפליקציה בנויה משני חלקים עיקריים:

1. מעטפת אפליקציה
- מסכים
- ניתוב
- state גלובלי
- Firebase
- UI לילדים ולהורים

2. מנוע משחק
- טעינת שלבים מתוך JSON
- parsing
- validation
- runtime engine
- game type registry
- reusable mini-games

## מבנה תיקיות מומלץ
מבנה התיקיות צריך להיות ברור, מודולרי וקל להרחבה. ברמת על מומלץ לעבוד כך:

- `/g/src/components`
- `/g/src/screens`
- `/g/src/game`
- `/g/src/game/engine`
- `/g/src/game/level-types`
- `/g/src/game/parsers`
- `/g/src/game/validators`
- `/g/src/game/runtime`
- `/g/src/game/ui`
- `/g/src/parent`
- `/g/src/store`
- `/g/src/hooks`
- `/g/src/services`
- `/g/src/assets`
- `/g/src/router`
- `/g/src/firebase`
- `/g/src/types`

## Global Game State
ה-state הגלובלי צריך לכלול לפחות:
- `currentUser`
- `currentChildProfile`
- `xp`
- `coins`
- `unlockedWorlds`
- `progressBySubject`
- `settings`
- `inventory`
- `currentLevel`
- `hearts`
- `dailyLimits`

פונקציות עיקריות שצריכות להיות זמינות דרך Context או store:
- `addXP()`
- `addCoins()`
- `unlockWorld()`
- `updateProgress()`
- `buyItem()`
- `setCurrentChildProfile()`
- `startMission()`
- `completeMission()`
- `saveGameState()`

## מסכים שחייבים להיבנות

### 1. Splash / Landing Screen
מטרת המסך:
- פתיחה ראשונית של האפליקציה
- הצגת המותג
- מעבר לאזור הילדים או לאזור ההורים

דרישות:
- מסך מלא
- רקע gradient צבעוני
- עננים או אלמנטים צפים עם אנימציה עדינה
- כותרת מרכזית: `World of Wisdom`
- כפתור ראשי: `Start Adventure`
- כפתור משני: `Parent Area`

### 2. Auth / Login Screen
מטרת המסך:
- התחברות עם Firebase Auth
- תמיכה ב-Google Sign-In

דרישות:
- מסך פשוט, ברור ונקי
- תמיכה במעבר מאובטח לאזור הורה או משתמש מחובר

### 3. Child Profile Selection Screen
מטרת המסך:
- בחירת פרופיל ילד לפני כניסה לעולם המשחק

דרישות:
- רשימת פרופילים
- אווטאר, שם, רמה
- כפתור `Add New Child`
- לחיצה על ילד מעבירה ל-`WorldMap`

### 4. Create / Edit Child Profile Screen
מטרת המסך:
- יצירה או עריכה של פרופיל ילד

דרישות:
- שם
- גיל
- בחירת אווטאר
- נושא/רמת התחלה

### 5. Avatar Builder Screen
מטרת המסך:
- התאמה אישית של דמות הילד

דרישות:
- תצוגה מקדימה גדולה במרכז
- טאבים עבור:
  - Hair
  - Eyes
  - Clothes
  - Pet
- עדכון חי של הדמות
- כפתור `Randomize`
- כפתור `Start Adventure`

### 6. World Map Screen
מטרת המסך:
- מסך מרכזי של התקדמות בעולם

דרישות:
- מפה מאוירת במסך מלא
- דמות על שביל
- לפחות 5 אזורים:
  - Forest of Numbers
  - Castle of Reading
  - Space English
  - Logic Cave
  - Memory Island
- לכל אזור:
  - locked / unlocked
  - אחוז השלמה
- top bar עם:
  - XP bar
  - coins
  - settings

### 7. Mission Selection Screen
מטרת המסך:
- בחירת משימה מתוך העולם שנבחר

דרישות:
- כותרת עולם
- grid של משימות
- בכל כרטיס:
  - icon
  - mission name
  - difficulty stars
  - locked overlay במידת הצורך

### 8. Game Screen
מטרת המסך:
- מעטפת אחידה לכל משחק דינמי

דרישות:
- top bar:
  - XP mini bar
  - 3 heart lives
  - hint button
  - pause/exit button
- center:
  - אזור קנבס או runtime area של Phaser
- bottom:
  - תשובות / פעולות אינטראקטיביות גדולות ונוחות למגע

מערכת רמזים:
- פתיחה דרך modal
- רמות רמז:
  1. רמז קטן
  2. רמז מורחב
  3. הסבר שלב-שלב
  4. פתרון מלא

### 9. Mission Complete Screen
מטרת המסך:
- סיום משימה והצגת תוצאה

דרישות:
- celebration animation
- stars earned
- XP gained
- coins earned
- `Continue Adventure`
- `View Explanation`

בכישלון:
- הודעה מעודדת
- `Retry`
- `View Full Explanation`

### 10. Progress Screen
מטרת המסך:
- הצגת ההתקדמות הכללית של הילד

דרישות:
- רמת הדמות
- XP bar
- פירוט התקדמות לפי עולמות
- badges
- pet evolution

### 11. Shop Screen
מטרת המסך:
- רכישת פריטים עם coins

דרישות:
- טאבים:
  - Clothes
  - Pets
  - Accessories
- grid של פריטים
- image
- price
- buy button

### 12. Parent Gate Screen
מטרת המסך:
- מניעת כניסה חופשית של ילדים לאזור ההורים

דרישות:
- PIN / שאלת אימות / מחסום הורה

### 13. Parent Dashboard Screen
מטרת המסך:
- דשבורד להורה לניהול ומעקב

דרישות:
- UI נקי ובהיר
- גרפים פשוטים עבור:
  - time spent
  - subjects progress
  - weak areas
- toggles עבור:
  - daily time limit
  - enable / disable subjects
- logout

### 14. Settings Screen
מטרת המסך:
- שליטה בהגדרות המערכת

דרישות:
- sound on/off
- music on/off
- language selection
- reset progress עם confirmation modal

### 15. Loading / Sync / Error Screens
מטרת המסכים:
- טיפול בטעינת נתונים, סנכרון, שגיאות רשת ו-offline

דרישות:
- loading state ברור
- error state ברור
- retry action

## מנוע המשחקים
מנוע המשחקים צריך להיות בנוי כך שכל משחק חדש יוכל להשתמש בתשתיות קיימות.

הדרישות מהמנוע:
- registry לסוגי משחקים
- parser לשלב
- validator
- game runtime אחיד
- interface קבוע לכל mini-game
- hooks/events לסיום שלב, כישלון, רמז, צבירת XP ו-rewards

## מערכת השלבים מבוססת JSON
כל שלב חייב להגיע מתוך JSON בלבד.

כל קובץ שלב צריך לכלול לפחות:
- `id`
- `worldId`
- `missionId`
- `type`
- `title`
- `instructions`
- `difficulty`
- `content`
- `answers`
- `hints`
- `rewards`
- `completionRules`
- `assets`

צריך לבנות:
- schema קשיח
- validator
- parser
- fallback לשגיאות תוכן
- דוגמאות JSON אמיתיות

## דוגמת סוגי שלבים נדרשים
- `multiple_choice`
- `drag_and_drop`
- `match_pairs`
- `memory_cards`

בהמשך צריך לאפשר הוספה קלה של סוגים נוספים כמו:
- `number_matching`
- `sequence_order`
- `tap_to_count`
- `listen_and_choose`

## דגשים לארכיטקטורה
- כל logic של Firebase צריך להיות בשכבת `services`
- קומפוננטות UI לא צריכות לכלול logic עסקי כבד
- כל game type צריך להיות מופרד לקבצים ברורים
- כל validator צריך להיות מופרד ממנוע הריצה
- צריך להעדיף שימוש חוזר על פני שכפול קוד
- צריך לאפשר הרחבה לעולמות, משימות, שפות ותכנים חדשים

## תוצרים ראשוניים מבוקשים
- מבנה תיקיות מקצועי
- קוד התחלתי מלא
- מערכת routing בסיסית
- Layout ראשי
- חיבור בסיסי ל-Firebase
- GameContext / store
- דוגמה ל-level JSON
- מערכת טעינת שלבים
- validator ל-level schema
- מסכי בסיס ראשוניים
- בסיס מוכן להרצה ולהרחבה

## כמה כללים מאוד חשובים
1. קבצים של המשחק צריכים להיות בתקיה הבאה: `/Users/tsoharzigdon/gamekids/g`
2. להשתמש בקוד הכי טוב, ברור ומקצועי שאפשר, עם naming איכותי, חלוקה נכונה לקבצים ותיקיות, והערות רק כשבאמת צריך.
3. צריך להתחשב בזה שיהיו הרבה שלבים, וכל שלב יגיע בתור מבנה `JSON`, ולכן המערכת חייבת להיות מותאמת לזה מההתחלה.
4. כל פעם שמבצעים עבודה, צריך לשמור הסבר קצר של מה שבוצע בתוך `history.md`, כדי שאם השיחה תתנתק יהיה אפשר להבין מה כבר נעשה ובאיזה שלב נמצאים.
5. חשוב לעבוד לפי המסמך הזה, לבדוק את עצמך פעמיים, ואם יש הצעה טובה יותר מבחינה מקצועית, צריך להציע אותה.
6. המטרה היא לבנות כמה סוגים של משחקים, ולכן צריך לבנות את המערכת כך שיהיה אפשר ליצור משחק חדש תוך שימוש חוזר בכמה שיותר תשתיות קיימות.
7. אין לכתוב תוכן של שלבים ישירות בתוך הקומפוננטות; כל תוכן משחקי צריך להגיע ממערכת התוכן וה-JSON.
8. כל מסך וכל קומפוננטה חייבים להיות mobile-first, responsive, ו-touch-friendly.
9. כל סוג משחק חדש חייב להגיע עם interface ברור, schema מתאים, validator, ודוגמת שלב.
10. חיבורי Firebase, שמירת נתונים וקריאות למסד הנתונים חייבים להיות מופרדים מה-UI ולא להיות hard-coded בתוך מסכים.
11. לפני הוספת פיצ'ר חדש צריך לבדוק אם אפשר להכניס אותו דרך מערכת reusable קיימת במקום לשכפל קוד.
12. כל שינוי מהותי צריך להישמר כך שהפרויקט יישאר buildable ומסודר, בלי להשאיר חלקים שבורים באמצע.
13. אם יש מצב שגיאה, חוסר בנתונים, או JSON לא תקין, המערכת חייבת להיכשל בצורה מבוקרת וברורה.
14. כל שמות הקבצים, התיקיות, המשתנים וה-types צריכים להיות אחידים, ברורים וקריאים לאורך כל הפרויקט.

## הערה לסדר העבודה
בכל שלב פיתוח צריך להתייחס למסמך הזה כבסיס המרכזי של הפרויקט. אם יש סתירה בין החלטות חדשות לבין המסמך, צריך לעדכן את המסמך בצורה מסודרת ולא לעבוד לפי הנחות לא כתובות.
