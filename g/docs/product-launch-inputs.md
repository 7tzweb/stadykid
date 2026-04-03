# Product Launch Inputs

הקובץ הזה מרכז במקום אחד את כל מה שאני צריך ממך כדי להפוך את הדמו למוצר אמיתי עם:

- כניסה עם Google בתחילת האפליקציה
- יצירת פרופיל ילד עם שם וגיל
- שמירה ב-Firebase Auth + Firestore
- מצב אדמין שזמין רק לך

## חשוב לפני שמתחילים

בדיקת אדמין לפי IP בלבד לא יכולה להיות מאובטחת אם היא נעשית רק בדפדפן.

כדי שזה יהיה מוצר אמיתי:

1. נזהה אותך בפרונט רק לצורך UI.
2. ההרשאה האמיתית לאדמין תיאכף בשרת / middleware / Cloud Function.

אם ה-IP שלך משתנה לפעמים, עדיף לשלב גם `Admin Email` ולא רק IP.

## הבלוק שאני צריך ממך

מלא את הערכים החסרים ושלח לי בחזרה:

```txt
APP_NAME=GameKids
APP_PRIMARY_LANGUAGE=he

DEPLOY_TARGET=firebase-hosting
PRODUCTION_APP_URL=
STAGING_APP_URL=
LOCAL_DEV_URL=http://127.0.0.1:5173

FIREBASE_PROJECT_NAME=
FIREBASE_PROJECT_ID=
FIREBASE_PROJECT_NUMBER=
FIREBASE_REGION=

FIREBASE_WEB_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=

GOOGLE_SIGNIN_ENABLED=yes
GOOGLE_SUPPORT_EMAIL=
GOOGLE_PUBLISHER_NAME=

AUTHORIZED_DOMAINS=localhost,127.0.0.1

ADMIN_PRIMARY_EMAIL=
ADMIN_BACKUP_EMAIL=
ADMIN_ALLOWED_IPS=
ADMIN_MODE_POLICY=ip_and_email

CHILD_MIN_AGE=4
CHILD_MAX_AGE=12
ALLOW_MULTIPLE_CHILDREN_PER_PARENT=yes
DEFAULT_MAX_CHILDREN_PER_PARENT=

USE_FIRESTORE=yes
USE_FIREBASE_STORAGE=no
USE_ANALYTICS=no
USE_CRASHLYTICS=no
```

## משתני הסביבה שהקוד כבר מצפה להם

כרגע הקוד כבר בנוי לקרוא את הערכים האלה מתוך `.env.local`:

```txt
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

בשלב החיבור האמיתי אוסיף גם:

```txt
VITE_ADMIN_ALLOWED_EMAILS=
VITE_ADMIN_ALLOWED_IPS=
VITE_APP_ENV=production
```

## מה צריך להגדיר ב-Firebase Console

אלה ההגדרות שצריך להפעיל:

1. ליצור פרויקט Firebase חדש.
2. להוסיף `Web App` לפרויקט.
3. להעתיק את ערכי ה-Web Config לבלוק שמעל.
4. להפעיל `Authentication`.
5. להפעיל ספק `Google`.
6. להוסיף את כל ה-Authorized Domains:
   - `localhost`
   - `127.0.0.1`
   - הדומיין של הפרודקשן
   - הדומיין של הסטייג'ינג אם יהיה
7. ליצור `Firestore Database` במצב Production.
8. לבחור Region אחד קבוע למסד.
9. אם נרצה בעתיד העלאת תמונות, להפעיל גם `Storage`.

## מבנה הנתונים שאני ממליץ עליו ב-Firestore

זה מבנה מומלץ למוצר אמיתי.  
לא צריך ליצור אותו ידנית. האפליקציה תיצור את המסמכים בכתיבה הראשונה.

```txt
users/{uid}
users/{uid}/children/{childId}
users/{uid}/children/{childId}/progress/summary
users/{uid}/children/{childId}/inventory/main
users/{uid}/children/{childId}/pets/main
users/{uid}/children/{childId}/settings/main
```

### users/{uid}

```json
{
  "displayName": "",
  "email": "",
  "photoUrl": "",
  "role": "parent",
  "isAdmin": false,
  "createdAt": "serverTimestamp",
  "lastLoginAt": "serverTimestamp"
}
```

### users/{uid}/children/{childId}

```json
{
  "name": "",
  "age": 6,
  "level": 1,
  "favoriteSubject": "",
  "petName": "",
  "currentHomeWorldId": "playroom-1",
  "avatarSeed": {
    "bodyColor": "",
    "hair": "",
    "eyes": "",
    "outfit": "",
    "pet": ""
  },
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### users/{uid}/children/{childId}/progress/summary

```json
{
  "stars": 0,
  "coins": 0,
  "xp": 0,
  "hearts": 3,
  "unlockedWorlds": [],
  "completedLevelIds": [],
  "progressBySubject": {},
  "lastMissionOutcome": null
}
```

### users/{uid}/children/{childId}/inventory/main

```json
{
  "inventory": [],
  "equippedItems": [],
  "ownedCreatures": []
}
```

### users/{uid}/children/{childId}/settings/main

```json
{
  "soundEnabled": true,
  "musicEnabled": true,
  "language": "he",
  "touchFeedback": true,
  "dailyLimits": {
    "enabled": false,
    "minutes": 20,
    "enabledSubjects": []
  }
}
```

## מצב אדמין אמיתי

כדי שאוכל להפוך את מצב האדמין לאמיתי, אני צריך ממך:

- כתובת ה-IP הציבורית הקבועה שלך
- כתובת Google שאיתה תתחבר
- פלטפורמת הדיפלוי הסופית

המלצה שלי למוצר אמיתי:

1. אדמין יאושר לפי `Google email`.
2. IP יהיה שכבת הגנה נוספת.
3. פעולות רגישות כמו שינוי מחירים ייבדקו גם בשרת.

## סדר העבודה שאני אבצע אחרי שתמלא

1. חיבור Firebase אמיתי במקום דמו.
2. כניסה עם Google במסך הראשון.
3. שמירת משתמש הורה במסד.
4. יצירת ילד חדש עם `שם + גיל`.
5. שמירת פרופילי ילדים ב-Firestore.
6. טעינת עולם המשחק לפי הילד שנבחר.
7. נעילת מצב אדמין רק לך.

## הערה על מה שכבר קיים בקוד

הבסיס כבר קיים:

- מסך כניסה עם כפתור Google
- מסך יצירת/בחירת ילד
- תשתית Firebase בסיסית
- שמירת state מקומית

אחרי שתחזיר לי את הערכים מהבלוק למעלה, אוכל לחבר את זה למוצר אמיתי בלי לעבוד על הנחות.
