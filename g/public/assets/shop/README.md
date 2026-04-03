תיקיות החנות מסודרות לפי קטגוריה:

- `eggs`
- `clothes`
- `accessories`
- `props`

כאן אפשר להכניס קבצי תמונה חדשים לכל קטגוריה.

נתוני פריטי החנות נשמרים ב:

- `g/src/game/content/shop-items.json`

שימו לב:

- ביצים/גורים עצמם עדיין נשלטים דרך קבצי היצורים:
  - `g/src/game/content/creatures.json`
  - `g/src/game/content/generated-creatures.ts`
- אם מוסיפים קובץ חדש לתיקייה, צריך גם להוסיף רשומה מתאימה לקובץ ה־JSON כדי שיופיע בחנות עם שם ומחיר.
