# מנהל משימות - מדריך התקנה והעלאה ל-Vercel

## 📋 מה יש בחבילה הזו?

אפליקציית Next.js מוכנה להעלאה עם:
- בורד שבועי מפוצל ל-7 ימים
- גרפים להשלמת משימות (יומי/שבועי/חודשי)
- תצוגות: יום, שבוע, חודש
- עיצוב מותאם לעברית (RTL)

---

## 🚀 מדריך העלאה ל-Vercel (צעד אחר צעד)

### שלב 1: התקנת דרישות מקדימות

#### התקנת Node.js
1. לך ל: https://nodejs.org
2. הורד את הגרסה "LTS" (מומלצת)
3. התקן והפעל מחדש את המחשב

#### בדיקה שההתקנה עבדה
פתח Terminal (Mac) או Command Prompt (Windows) והקלד:
```bash
node --version
```
אם אתה רואה מספר גרסה (למשל v18.17.0) - מעולה!

---

### שלב 2: יצירת חשבון GitHub

1. לך ל: https://github.com
2. לחץ "Sign up" וצור חשבון חינמי
3. אשר את המייל שלך

---

### שלב 3: העלאת הקוד ל-GitHub

#### אפשרות א': דרך GitHub Desktop (קל יותר)

1. הורד GitHub Desktop: https://desktop.github.com
2. התחבר לחשבון GitHub שלך
3. לחץ "File" → "Add Local Repository"
4. בחר את התיקייה `task-manager-app`
5. לחץ "Create Repository"
6. לחץ "Publish Repository"
7. תן שם (למשל: `task-manager`) ולחץ "Publish"

#### אפשרות ב': דרך Terminal

```bash
# כנס לתיקיית הפרויקט
cd task-manager-app

# אתחל Git
git init

# הוסף את כל הקבצים
git add .

# צור commit
git commit -m "Initial commit"

# צור repository ב-GitHub (צריך GitHub CLI)
gh repo create task-manager --public --source=. --push
```

---

### שלב 4: יצירת חשבון Vercel והעלאה

1. לך ל: https://vercel.com
2. לחץ "Sign Up" → "Continue with GitHub"
3. אשר את החיבור ל-GitHub
4. לחץ "Add New..." → "Project"
5. מצא את ה-repository `task-manager` ולחץ "Import"
6. **אל תשנה כלום בהגדרות** - Vercel מזהה Next.js אוטומטית
7. לחץ "Deploy"
8. חכה 1-2 דקות... 🎉

---

### שלב 5: קבלת הלינק

אחרי שה-Deploy מסתיים, תקבל לינק כזה:
```
https://task-manager-xxxxx.vercel.app
```

**זהו! האתר שלך באוויר!** 🚀

---

## 🔄 עדכון האתר

כל פעם שתעדכן קוד ותעשה push ל-GitHub, Vercel יעדכן את האתר אוטומטית.

---

## ❓ בעיות נפוצות

### "npm not found"
- התקן Node.js מחדש מ-nodejs.org

### "Permission denied"
- ב-Mac הרץ: `sudo npm install`
- ב-Windows פתח Terminal כ-Administrator

### הדף ריק אחרי Deploy
- בדוק ב-Vercel בלוגים אם יש שגיאות
- ודא שכל הקבצים הועלו ל-GitHub

---

## 📱 טיפ: הוספה למסך הבית בטלפון

1. פתח את הלינק בטלפון
2. באייפון: לחץ על כפתור השיתוף → "Add to Home Screen"
3. באנדרואיד: לחץ על 3 נקודות → "Add to Home Screen"

עכשיו יש לך "אפליקציה" בטלפון!

---

## 🛠 פיתוח מקומי (אופציונלי)

אם תרצה לערוך את הקוד מקומית:

```bash
# התקנת dependencies
npm install

# הפעלה מקומית
npm run dev
```

פתח http://localhost:3000 בדפדפן.

---

בהצלחה! 🎯
