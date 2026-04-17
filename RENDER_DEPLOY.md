# 🚀 تعليمات النشر السريع على Render

## الطريقة الأسهل (زر واحد):
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mansour305x/MMM)

**الخطوات:**
1. اضغط الزر أعلاه
2. اختر **Free Plan**
3. أكمل البيانات
4. تم! ✅

---

## إذا حصلت مشكلة - اتبع الطريقة اليدوية:

### 1️⃣ إنشاء قاعدة البيانات (PostgreSQL)
```bash
# على Render Dashboard:
- New → PostgreSQL (Free)
- اسم: mmm-postgres
- انسخ Connection String
```

### 2️⃣ إنشاء Redis
```bash
# على Render Dashboard:
- New → Redis (Free)
- اسم: mmm-redis
- انسخ Redis URL
```

### 3️⃣ نشر الخادم (API)
```bash
# على Render Dashboard:
- New → Web Service
- اختر GitHub repository: MMM
- Build Command: cd server && npm install && npm run build
- Start Command: cd server && node dist/server.js
- Plan: Free

# متغيرات البيئة:
NODE_ENV=production
PORT=4000
JWT_SECRET=mmm_jwt_secret_key_here
REFRESH_SECRET=mmm_refresh_secret_key_here
DATABASE_URL=[من PostgreSQL]
REDIS_URL=[من Redis]
CORS_ORIGIN=https://mmm-frontend-xxx.onrender.com
SMS_PROVIDER=mock
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1 minute
```

### 4️⃣ نشر الواجهة (Frontend)
```bash
# على Render Dashboard:
- New → Static Site
- اختر GitHub repository: MMM
- Build Command: echo "Deployed"
- Publish Directory: .
- Plan: Free
```

### 5️⃣ تشغيل قاعدة البيانات
```bash
# في جهازك:
psql [DATABASE_URL] < server/db/schema.sql
npm run db:seed
```

---

## بيانات الدخول الافتراضية:
```
Email: owner@mmm.com
Password: Owner@12345
```

## الروابط بعد الرفع:
- **API:** https://mmm-api-xxx.onrender.com
- **Frontend:** https://mmm-frontend-xxx.onrender.com
