# MMM Platform

منصة إدارة عملاء ورسائل احترافية بهوية Black/Gold داكنة، مع Backend كامل (API + RBAC + OTP + Queue + SMS + Modules) وقاعدة بيانات PostgreSQL جاهزة للتشغيل.

## Stack النهائي (2025+)
- Frontend: HTML5 + CSS3 + JavaScript (RTL)
- Backend: Node.js 22 + TypeScript + Fastify 5
- Database: PostgreSQL 17
- Queue: BullMQ + Redis 7
- Auth: JWT Access/Refresh + OTP
- Validation: Zod
- Security: Helmet + CORS + Rate Limiting + RBAC + Password Hashing

## بنية المشروع
```
MMM/
	assets/
		css/design-system.css
	index.html
	login.html
	register.html
	otp.html
	dashboard.html
	customers.html
	fields.html
	messages.html
	permissions.html
	settings.html
	modules.html
	server/
		db/schema.sql
		scripts/seed.ts
		src/
			app.ts
			server.ts
			config/
			controllers/
			middleware/
			models/
			repositories/
			routes/
			services/
			jobs/
			utils/
			types/
		tests/api.test.ts
		package.json
		tsconfig.json
		.env.example
		Dockerfile
	docker-compose.yml
```

## تشغيل المشروع خطوة بخطوة
1. تشغيل PostgreSQL + Redis:
```bash
docker compose up -d
```

2. تجهيز الخادم:
```bash
cd server
cp .env.example .env
npm install
```

3. إدخال بيانات تجريبية وصلاحيات:
```bash
npm run db:seed
```

4. تشغيل API:
```bash
npm run dev
```

5. فتح الواجهة:
- افتح صفحات HTML مباشرة من المشروع (مثال: `index.html`) أو عبر Live Server.
- API الافتراضي على `http://localhost:4000`.

## حسابات جاهزة (بعد Seed)
- Owner: `owner@mmm.com` / `Owner@12345`
- Supervisor: `supervisor@mmm.com` / `Supervisor@12345`
- Member: `member@mmm.com` / `Member@12345`

## الوحدات المنفذة
- Auth: Register/Login/Forgot Password/Reset Password/OTP Verify
- RBAC: Roles + Permissions + Role Permission Matrix
- Users: Create/List/Update Profile
- Clients: Create/Read/Update/Delete
- Dynamic Fields: Create/List + Client Value Upsert
- Messaging: Single + Bulk + Schedule + Recurrence
- Modules: Add/Enable/Disable from dashboard

## تغطية الجداول
- `users`
- `roles`
- `permissions`
- `role_permissions`
- `clients`
- `custom_fields`
- `client_field_values`
- `sms_messages`
- `scheduled_messages`
- `modules`
- `auth_otps`
- `auth_refresh_tokens`
- `audit_logs`

## اختبار الجودة QA
### اختبار العضو
- تسجيل حساب جديد عبر `/api/auth/register`.
- تفعيل OTP عبر `/api/auth/verify-otp`.
- تسجيل دخول عبر `/api/auth/login`.
- تعديل الملف عبر `PATCH /api/users/me`.
- التحقق من منع الوصول لنقاط owner/supervisor.

### اختبار المشرف
- تسجيل دخول supervisor.
- إدارة العملاء: `GET/POST/PATCH/DELETE /api/clients`.
- إرسال رسالة فردية وجماعية.
- التحقق من رفض `roles.manage` و`modules.manage`.

### اختبار المالك
- إدارة المستخدمين والأدوار.
- إدارة الصلاحيات.
- إدارة الحقول الديناميكية.
- إدارة الميزات.
- إدارة الرسائل والجدولة.

### اختبار حالات الخطأ
- مدخلات ناقصة/غير صحيحة تعيد `422`.
- بيانات دخول خاطئة تعيد `401`.
- صلاحيات غير كافية تعيد `403`.
- كيان غير موجود يعيد `404`.

## فحص الأمان
- Password hashing باستخدام `bcryptjs`.
- OTP مخزن كـ hash.
- Refresh token مخزن كـ hash.
- JWT access/refresh منفصل.
- Rate limit على API.
- Helmet headers.
- RBAC middleware على كل endpoint حساس.

## فحص الأداء
- Indexes على الأعمدة التشغيلية الحساسة في `schema.sql`.
- Queue للرسائل بدل التنفيذ المتزامن.
- اتصال PostgreSQL عبر Pool.

## تشغيل الاختبارات
```bash
cd server
npm test
```

## ملاحظات التسليم
- الواجهات الجاهزة موجودة ومتماسكة بصريًا (Black/Gold Dark).
- API كامل وقابل للتمديد.
- قاعدة البيانات مكتملة مع العلاقات والفهارس.
- البنية جاهزة للنشر في بيئة Docker/Cloud.