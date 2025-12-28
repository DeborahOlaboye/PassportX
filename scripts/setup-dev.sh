#!/bin/bash

set -e

echo "🚀 PassportX Development Environment Setup"
echo "=========================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.x or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18.x or higher is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm -v) found"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker $(docker -v | cut -d' ' -f3 | tr -d ',') found"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker not found. Docker is optional but recommended for local development."
    DOCKER_AVAILABLE=false
fi

# Check Clarinet for smart contracts
if command -v clarinet &> /dev/null; then
    echo "✅ Clarinet $(clarinet --version | cut -d' ' -f2) found"
    CLARINET_AVAILABLE=true
else
    echo "⚠️  Clarinet not found. Required for smart contract development."
    echo "   Install from: https://github.com/hirosystems/clarinet"
    CLARINET_AVAILABLE=false
fi

echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo "✅ Root dependencies installed"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..
echo "✅ Backend dependencies installed"
echo ""

# Setup environment files
echo "⚙️  Setting up environment files..."

if [ ! -f .env.local ]; then
    echo "Creating .env.local from example..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local (please update with your values)"
else
    echo "ℹ️  .env.local already exists"
fi

if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env (please update with your values)"
else
    echo "ℹ️  backend/.env already exists"
fi

echo ""

# Setup Git hooks
echo "🪝 Setting up Git hooks..."
npm run prepare 2>/dev/null || npx husky install
echo "✅ Git hooks installed"
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npx tsc --noEmit || echo "⚠️  TypeScript compilation had errors (this is OK for initial setup)"
echo ""

# Database setup
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "🐳 Would you like to start the local database with Docker? (y/n)"
    read -r START_DB
    if [ "$START_DB" = "y" ] || [ "$START_DB" = "Y" ]; then
        docker-compose up -d mongodb
        echo "✅ MongoDB started on port 27017"
        echo "   Connection string: mongodb://admin:password@localhost:27017/passportx?authSource=admin"
    fi
    echo ""
fi

# Smart contracts check
if [ "$CLARINET_AVAILABLE" = true ]; then
    echo "🔗 Checking smart contracts..."
    cd contracts
    clarinet check
    echo "✅ Smart contracts validated"
    cd ..
    echo ""
fi

echo "✨ Setup Complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Update environment variables:"
echo "   - Edit .env.local for frontend config"
echo "   - Edit backend/.env for backend config"
echo ""
echo "2. Start the development servers:"
echo "   - Frontend: npm run dev"
echo "   - Backend:  cd backend && npm run dev"
echo "   - Or use Docker: docker-compose up"
echo ""
echo "3. Run tests:"
echo "   - All tests:      npm run test"
echo "   - Unit tests:     npm run test:unit"
echo "   - Contract tests: npm run test:contracts"
echo "   - E2E tests:      npm run test:e2e"
echo ""
echo "4. Read the documentation:"
echo "   - README.md"
echo "   - CONTRIBUTING.md"
echo "   - backend/API_DOCUMENTATION.md"
echo ""
echo "Happy coding! 🎉"
