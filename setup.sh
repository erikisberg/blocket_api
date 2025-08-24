#!/bin/bash

echo "🚀 Setting up Blocket Listings Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Copy the full listings data
echo "📋 Copying listings data..."
cp ../bevakningar_listings.json public/listings.json

if [ $? -eq 0 ]; then
    echo "✅ Listings data copied successfully!"
else
    echo "⚠️  Could not copy listings data. You may need to copy it manually."
fi

echo ""
echo "🎉 Setup complete! You can now start the frontend:"
echo ""
echo "   npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "📁 Frontend files created:"
echo "   - Next.js app with shadcn/ui"
echo "   - Swedish interface"
echo "   - Image slider component"
echo "   - Search and filtering"
echo "   - Responsive design"
echo "   - AI-powered undervaluation analysis"
echo ""
echo "🤖 AI-FUNKTIONER:"
echo "   - Automatisk värderingsanalys"
echo "   - 1-5 poängskala för undervärdering"
echo "   - Detaljerad motivering på svenska"
echo "   - Handelsrekommendationer"
echo ""
echo "⚠️  VIKTIGT: Du behöver en Anthropic API-nyckel för AI-funktionerna!"
echo "   1. Gå till https://console.anthropic.com/"
echo "   2. Skapa en API-nyckel"
echo "   3. Kopiera env.example till .env.local"
echo "   4. Lägg till din API-nyckel i .env.local"
