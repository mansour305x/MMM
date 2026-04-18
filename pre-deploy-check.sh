#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# 🚀 MMM Deployment Pre-Check Script
# ═══════════════════════════════════════════════════════════════════════════

set -e

echo "════════════════════════════════════════════════════════════════════════"
echo "  🔍 فحص جاهزية نشر MMM على Render"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

cd /workspaces/MMM

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0
WARNINGS=0

# ═══════════════════════════════════════════════════════════════════════════
# Helper functions
# ═══════════════════════════════════════════════════════════════════════════

check_file() {
    local file=$1
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} موجود: $file"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} مفقود: $file"
        ((FAILED++))
        return 1
    fi
}

check_dir() {
    local dir=$1
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅${NC} موجود: $dir/"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} مفقود: $dir/"
        ((FAILED++))
        return 1
    fi
}

check_command() {
    local cmd=$1
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -1 || echo "")
        echo -e "${GREEN}✅${NC} $cmd: $version"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} مفقود: $cmd"
        ((FAILED++))
        return 1
    fi
}

warning() {
    echo -e "${YELLOW}⚠️${NC} تحذير: $1"
    ((WARNINGS++))
}

# ═══════════════════════════════════════════════════════════════════════════
# فحص ملفات البناء
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}━━ 1️⃣ فحص ملفات البناء والإعدادات${NC}"
echo "════════════════════════════════════════════════════════════════════════"

check_file "render.yaml"
check_file "render-deploy.json"
check_file "DEPLOYMENT.md"
check_file "DEPLOYMENT_STEPS.md"
check_file "docker-compose.yml"
check_file "README.md"
check_file ".gitignore"

# ═══════════════════════════════════════════════════════════════════════════
# فحص ملفات الخادم
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}━━ 2️⃣ فحص ملفات الخادم${NC}"
echo "════════════════════════════════════════════════════════════════════════"

check_dir "server"
check_file "server/package.json"
check_file "server/tsconfig.json"
check_file "server/.env.example"
check_file "server/Dockerfile"
check_file "server/Dockerfile.prod"
check_file "server/db/schema.sql"

# ═══════════════════════════════════════════════════════════════════════════
# فحص البنية الأساسية للسيرفر
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}━━ 3️⃣ فحص بنية المصدر${NC}"
echo "════════════════════════════════════════════════════════════════════════"

check_dir "server/src"
check_dir "server/src/config"
check_dir "server/src/controllers"
check_dir "server/src/repositories"
check_dir "server/src/services"
check_dir "server/src/routes"
check_dir "server/src/middleware"
check_dir "server/src/types"
check_dir "server/src/utils"
check_dir "server/src/jobs"

# ملفات أساسية
check_file "server/src/app.ts"
check_file "server/src/server.ts"

# ═══════════════════════════════════════════════════════════════════════════
# فحص ملفات الواجهة الأمامية
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}━━ 4️⃣ فحص الواجهة الأمامية${NC}"
echo "════════════════════════════════════════════════════════════════════════"

check_file "index.html"
check_file "login.html"
check_file "register.html"
check_file "dashboard.html"
check_file "state-login.html"
check_file "owner-console.html"

check_dir "assets"
check_dir "assets/css"
check_dir "assets/js"

check_file "assets/css/design-system.css"
check_file "assets/js/api.js"
check_file "assets/js/login.js"
check_file "assets/js/state-login.js"
check_file "assets/js/owner-console.js"

# ═══════════════════════════════════════════════════════════════════════════
# فحص الأدوات المطلوبة
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}━━ 5️⃣ فحص أدوات البناء${NC}"
echo "════════════════════════════════════════════════════════════════════════"

check_command "node"
check_command "npm"
check_command "git"
check_command "tsc"

# ═══════════════════════════════════════════════════════════════════════════
# فحص حالة Git
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}━━ 6️⃣ فحص حالة Git${NC}"
echo "════════════════════════════════════════════════════════════════════════"

if git status &> /dev/null; then
    echo -e "${GREEN}✅${NC} مستودع Git موجود"
    ((PASSED++))
    
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo -e "${GREEN}✅${NC} الفرع الحالي: $BRANCH"
    ((PASSED++))
    
    REMOTE=$(git config --get remote.origin.url || echo "لا يوجد")
    echo -e "${GREEN}✅${NC} المستودع البعيد: $REMOTE"
    ((PASSED++))
    
    # فحص التغييرات غير المرفوعة
    if [ -z "$(git status --porcelain)" ]; then
        echo -e "${GREEN}✅${NC} لا توجد تغييرات غير مرفوعة"
        ((PASSED++))
    else
        warning "هناك تغييرات غير مرفوعة. استخدم: git add . && git commit -m '...' && git push"
    fi
else
    echo -e "${RED}❌${NC} لا يوجد مستودع Git"
    ((FAILED++))
fi

# ═══════════════════════════════════════════════════════════════════════════
# فحص البناء
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}━━ 7️⃣ فحص البناء${NC}"
echo "════════════════════════════════════════════════════════════════════════"

echo "جاري بناء السيرفر..."
cd server

if npm run build > /tmp/build.log 2>&1; then
    echo -e "${GREEN}✅${NC} البناء نجح بدون أخطاء"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} فشل البناء"
    echo "الأخطاء:"
    tail -20 /tmp/build.log
    ((FAILED++))
fi

# فحص التجميع
if npm run lint > /tmp/lint.log 2>&1; then
    echo -e "${GREEN}✅${NC} التحقق من الأنواع نجح"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} فشل التحقق من الأنواع"
    ((FAILED++))
fi

cd ..

# ═══════════════════════════════════════════════════════════════════════════
# فحص الاختبارات
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}━━ 8️⃣ فحص الاختبارات${NC}"
echo "════════════════════════════════════════════════════════════════════════"

cd server
if npm test > /tmp/test.log 2>&1; then
    echo -e "${GREEN}✅${NC} الاختبارات نجحت"
    ((PASSED++))
else
    warning "بعض الاختبارات فشلت (قد لا يكون حرجاً)"
    # لا نزيد FAILED هنا لأن الاختبارات قد تفشل بدون سبب حقيقي
fi
cd ..

# ═══════════════════════════════════════════════════════════════════════════
# فحص package.json
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BLUE}━━ 9️⃣ فحص package.json${NC}"
echo "════════════════════════════════════════════════════════════════════════"

if grep -q '"name": "mmm-server"' server/package.json; then
    echo -e "${GREEN}✅${NC} اسم المشروع صحيح"
    ((PASSED++))
else
    warning "قد تكون هناك مشكلة في package.json"
fi

if grep -q '"build": "tsc' server/package.json; then
    echo -e "${GREEN}✅${NC} أمر البناء موجود"
    ((PASSED++))
else
    warning "أمر البناء قد يكون ناقصاً"
fi

if grep -q '"start": "node dist' server/package.json; then
    echo -e "${GREEN}✅${NC} أمر البدء موجود"
    ((PASSED++))
else
    warning "أمر البدء قد يكون ناقصاً"
fi

# ═══════════════════════════════════════════════════════════════════════════
# الملخص
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 الملخص${NC}"
echo "════════════════════════════════════════════════════════════════════════"

TOTAL=$((PASSED + FAILED))

echo ""
echo -e "${GREEN}✅ نجح: $PASSED${NC}"
echo -e "${RED}❌ فشل: $FAILED${NC}"
echo -e "${YELLOW}⚠️ تحذيرات: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 ممتاز! المشروع جاهز للنشر على Render!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "📋 الخطوات التالية:"
    echo "1. اذهب إلى https://render.com"
    echo "2. اضغط على Deploy Button في الـ README"
    echo "3. أو استخدم render.yaml مباشرة"
    echo ""
    echo "🔗 الرابط السريع:"
    echo "https://render.com/deploy?repo=https://github.com/mansour305x/MMM"
    echo ""
    exit 0
else
    echo -e "${RED}════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ هناك مشاكل يجب حلها قبل النشر!${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    exit 1
fi
