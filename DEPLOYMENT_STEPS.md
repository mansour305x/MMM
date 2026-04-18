# 🚀 خطوات نشر MMM على Render - دليل شامل

**التاريخ:** 18 April 2026  
**الحالة:** ✅ جاهز للنشر  
**الإصدار:** 1.0.0 - Multi-tenant State Isolation Complete

---

## ✨ المميزات الجديدة في هذا الإصدار

✅ عزل البيانات على مستوى الحالة (State-Level Isolation)  
✅ حسابات الحالات المنفصلة (State Accounts)  
✅ حساب مالك ثابت (Owner Account: danger/Aa123456)  
✅ مسجل الميزات الديناميكي (Dynamic Feature Registry)  
✅ إعدادات لكل حالة (Per-State Settings)  
✅ JWT محسّن مع معلومات الحالة  
✅ تصفية الريبوزتوري لجميع الكيانات  
✅ صفحات واجهة المستخدم الجديدة (State Login, Owner Console)  

---

## 🚀 الطريقة السريعة (زر واحد)

فقط انقر على الزر أدناه:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mansour305x/MMM)

**ستقوم بـ:**
1. ✅ ربط مستودعك على GitHub
2. ✅ إنشاء قاعدة البيانات PostgreSQL
3. ✅ إنشاء خادم Redis
4. ✅ نشر الـ Backend API
5. ✅ نشر الـ Frontend Static
6. ✅ ملء جميع المتغيرات البيئية تلقائياً

---

## 🔧 الطريقة اليدوية (إذا لم ينجح الزر)

### الخطوة 1️⃣: تسجيل الدخول إلى Render

1. اذهب إلى https://render.com
2. سجل الدخول أو أنشئ حساباً
3. اضغط على **Dashboard**

---

### الخطوة 2️⃣: إنشاء قاعدة البيانات PostgreSQL

```bash
1. اضغط "New" → "PostgreSQL"
2. اسم الخدمة: mmm-postgres
3. Database Name: mmm
4. User: mmm
5. Region: أقرب منطقة لك (مثلاً Germany)
6. Plan: Free
7. اضغط "Create Database"
```

**⚠️ انسخ Connection String (ستحتاجها لاحقاً)**

---

### الخطوة 3️⃣: إنشاء خادم Redis

```bash
1. اضغط "New" → "Redis"
2. اسم الخدمة: mmm-redis
3. Region: Germany (نفس المنطقة)
4. Plan: Free
5. اضغط "Create Redis"
```

**⚠️ انسخ Redis URL (ستحتاجها لاحقاً)**

---

### الخطوة 4️⃣: ربط GitHub (أحد الخيارات)

#### الخيار A: استخدام render.yaml (الأسهل)
```bash
1. اضغط "New" → "Web Service"
2. اختر "Connect a Git repository"
3. ابحث عن: mansour305x/MMM
4. اختر Main Branch
5. في Configuration استخدم render.yaml:
   - اضغط "Use Configuration File"
   - اختر render.yaml
6. اضغط "Deploy"
```

#### الخيار B: إعدادات يدوية
```bash
1. اضغط "New" → "Web Service"
2. اختر Repository: mansour305x/MMM
3. Build Command:
   cd server && npm install && npm run build
4. Start Command:
   cd server && node dist/src/server.js
5. Plan: Free
6. اضغط "Create Web Service"
```

---

### الخطوة 5️⃣: إضافة متغيرات البيئة

في صفحة Web Service، تحت **Environment**، أضف المتغيرات:

```bash
# نسخ هذا كما هو:

NODE_ENV = production
PORT = 4000
HOST = 0.0.0.0
JWT_SECRET = (توليد عشوائي - استخدم أي نص قوي)
REFRESH_SECRET = (توليد عشوائي - استخدم أي نص قوي)
OTP_TTL_SECONDS = 300
OTP_RESEND_COOLDOWN_SECONDS = 60
SMS_PROVIDER = mock
SMS_SENDER_ID = MMM
RATE_LIMIT_MAX = 100
RATE_LIMIT_WINDOW = 1 minute

# المهم جداً - استبدل بقيمك:
DATABASE_URL = [الرابط من PostgreSQL]
REDIS_URL = [الرابط من Redis]
CORS_ORIGIN = https://mmm-frontend-xxx.onrender.com
```

---

### الخطوة 6️⃣: نشر الـ Frontend

```bash
1. اضغط "New" → "Static Site"
2. اختر Repository: mansour305x/MMM
3. اترك Build Command فارغ (OR اكتب: echo "Static")
4. Publish Directory: .
5. اضغط "Create Static Site"
```

---

### الخطوة 7️⃣: تشغيل قاعدة البيانات

بعد أن تعرض Render أن الخدمات تعمل، قم بتنفيذ (من جهازك المحلي):

```bash
# استبدل البيانات:
export DATABASE_URL="[الرابط من PostgreSQL]"

# تشغيل الـ migrations:
cd /workspaces/MMM/server
npm install
npm run db:migrate

# تشغيل البذور:
npm run db:seed
```

---

## ✅ التحقق من النشر

### 1. فحص صحة الخادم
```bash
curl https://mmm-api-xxx.onrender.com/health
```

يجب أن تحصل على:
```json
{"status":"ok","service":"mmm-api"}
```

### 2. زيارة الواجهة الأمامية
```bash
https://mmm-frontend-xxx.onrender.com/login.html
```

### 3. اختبار بيانات الدخول

**حساب المالك:**
```
Username: danger
Password: Aa123456
```

هذا سيعطيك توكن global scope للوصول إلى جميع البيانات.

**حساب الحالة (Makkah):**
```
State Name: Makkah
Password: Aa123456
```

---

## 🛠️ استكشاف الأخطاء

### الخطأ: Build Failed
```bash
✅ الحل:
1. تحقق من أن package.json موجود
2. تأكد من npm install يعمل محلياً
3. افحص Logs في Render Dashboard
```

### الخطأ: Database Connection Error
```bash
✅ الحل:
1. تحقق من DATABASE_URL الصحيح
2. تأكد من أن PostgreSQL يعمل
3. جرب الاتصال محلياً: psql $DATABASE_URL
```

### الخطأ: Redis Connection Error
```bash
✅ الحل:
1. تحقق من REDIS_URL الصحيح
2. تأكد من أن Redis service مُنشأ
3. في الإنتاج، قد تحتاج إلى استخدام TLS port
```

---

## 📊 URLs بعد النشر

| الخدمة | URL |
|------|-----|
| **Render Dashboard** | https://dashboard.render.com |
| **API Health** | https://mmm-api-xxx.onrender.com/health |
| **Frontend** | https://mmm-frontend-xxx.onrender.com |
| **PostgreSQL** | Connection string من Dashboard |
| **Redis** | Connection string من Dashboard |

---

## 🔐 متغيرات البيئة الإنتاجية

### معايير الأمان
✅ استخدم أسرار قوية للـ JWT (32+ حرف عشوائي)  
✅ غيّر كلمات المرور الافتراضية للـ database  
✅ استخدم HTTPS فقط  
✅ قيّد CORS_ORIGIN لنطاقك فقط  

### المتغيرات الحتمية
```bash
NODE_ENV=production          # لا تكتب development أبداً
PORT=4000                    # Render سيعيد تعيينه
JWT_SECRET=<random>         # استخدم 32+ حرف
REFRESH_SECRET=<random>     # استخدم 32+ حرف
DATABASE_URL=<postgres>     # من PostgreSQL service
REDIS_URL=<redis>           # من Redis service
```

---

## 📱 اختبار سريع بعد النشر

```bash
# 1. تسجيل دخول المالك
curl -X POST https://mmm-api-xxx.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"danger","password":"Aa123456"}'

# 2. تسجيل دخول الحالة
curl -X POST https://mmm-api-xxx.onrender.com/api/auth/login-state \
  -H "Content-Type: application/json" \
  -d '{"stateName":"Makkah","password":"Aa123456"}'

# 3. الحصول على قائمة العملاء
curl -X GET https://mmm-api-xxx.onrender.com/api/clients \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🎯 الخطوات التالية بعد النشر

- [ ] اختبار جميع endpoints بـ owner account
- [ ] اختبر التسجيل والدخول من خلال الواجهة الأمامية
- [ ] تحقق من عزل البيانات بين الحالات
- [ ] اربط نطاقك الخاص (إذا أردت)
- [ ] أعد تعيين كلمات المرور الافتراضية
- [ ] قم بإنشاء حالات جديدة وحسابات مستخدمين

---

## 📚 الموارد الإضافية

| الموضوع | الرابط |
|--------|--------|
| توثيق Render | https://render.com/docs |
| توثيق Fastify | https://www.fastify.io |
| توثيق PostgreSQL | https://www.postgresql.org/docs |
| توثيق Redis | https://redis.io/docs |
| توثيق JWT | https://jwt.io |

---

## ❓ أسئلة متكررة

**س: هل يمكنني استخدام قاعدة بيانات موجودة؟**  
ج: نعم، فقط استخدم CONNECTION STRING الموجود في DATABASE_URL

**س: كم سعر الـ Free Plan؟**  
ج: مجاني تماماً، لكن القيود معينة (مثل توقف تلقائي بعد 15 دقيقة عدم نشاط)

**س: كيف أحدّث الكود بعد النشر؟**  
ج: فقط اعمل git push إلى main، Render سيعيد البناء تلقائياً

**س: كيف أشغّل migrations بعد التحديثات؟**  
ج: استخدم Render Shell أو قاعدة بيانات admin panel

---

## 📝 ملاحظات مهمة

> ⚠️ **الـ Free Plans لديها حدود:**
> - توقف تلقائي بعد 15 دقيقة عدم نشاط
> - حد أقصى 400 ساعة شهرياً
> - لا توجد ساعات بطاريات

> ✅ **للإنتاج الحقيقي:**
> - اترقى إلى Pro Plan أو استخدم VPS آخر
> - استخدم domain name خاص بك
> - فعّل SSL/TLS
> - استخدم CDN لتقليل التأخير

---

**تم إنشاؤه بواسطة:** AI Assistant  
**آخر تحديث:** 18 April 2026  
**الحالة:** ✅ Ready for Production Deployment
