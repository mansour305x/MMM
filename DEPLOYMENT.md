#!/bin/bash
set -e

echo "🚀 Starting MMM Platform Deployment to Render..."

echo "📦 Installing backend dependencies..."
cd server
npm install
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "📋 Deployment Instructions:"
echo ""
echo "1. Go to https://render.com"
echo "2. Click 'New +' > 'Web Service'"
echo "3. Connect your GitHub repository: mansour305x/MMM"
echo "4. Configure:"
echo "   - Name: mmm-api"
echo "   - Runtime: Node"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm run start"
echo "   - Plan: Free"
echo ""
echo "5. Add these Environment Variables:"
echo "   - NODE_ENV=production"
echo "   - PORT=4000"
echo "   - JWT_SECRET=your_super_secret_key_here"
echo "   - REFRESH_SECRET=your_refresh_secret_key_here"
echo "   - DATABASE_URL=postgresql://user:pass@host:5432/mmm"
echo "   - REDIS_URL=redis://default:pass@host:6379"
echo "   - CORS_ORIGIN=https://your-frontend-url.onrender.com"
echo "   - SMS_PROVIDER=mock"
echo "   - RATE_LIMIT_MAX=100"
echo "   - RATE_LIMIT_WINDOW=1 minute"
echo ""
echo "6. Deploy!"
