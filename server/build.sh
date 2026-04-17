#!/bin/bash
set -e

echo "Building MMM Backend Server..."
npm install
npm run build
echo "✅ Build completed successfully"
