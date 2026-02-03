#!/bin/bash

echo "🚀 Job Tracker - Full Stack Setup"
echo "=================================="
echo ""

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first."
    exit 1
fi

echo "📦 Installing dependencies..."
echo ""

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install extension dependencies
echo "Installing extension dependencies..."
cd extension
npm install
cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""

# Setup environment file
if [ ! -f server/.env ]; then
    echo "📝 Creating server .env file..."
    cp server/.env.example server/.env
    echo "⚠️  Please edit server/.env with your database credentials"
fi

echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Setup your database:"
echo "   createdb job_tracker"
echo ""
echo "2. Edit server/.env with your database credentials"
echo ""
echo "3. Generate Prisma client and run migrations:"
echo "   cd server"
echo "   npm run prisma:generate"
echo "   npm run migrate"
echo ""
echo "4. Start the backend server:"
echo "   cd server"
echo "   npm run dev"
echo ""
echo "5. Build the extension (in a new terminal):"
echo "   cd extension"
echo "   npm run build"
echo ""
echo "6. Load the extension in Chrome:"
echo "   - Go to chrome://extensions/"
echo "   - Enable Developer mode"
echo "   - Click 'Load unpacked'"
echo "   - Select the extension/dist folder"
echo ""
echo "7. Don't forget to add icons to extension/public/icons/"
echo "   - icon16.png (16x16)"
echo "   - icon48.png (48x48)"
echo "   - icon128.png (128x128)"
echo ""
echo "📚 See README.md for more details"
echo ""