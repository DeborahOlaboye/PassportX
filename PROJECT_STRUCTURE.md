# PassportX Project Structure

## Overview
PassportX is a full-stack Web3 application with frontend, backend, smart contracts, and comprehensive testing infrastructure.

## Directory Structure

```
PassportX/
├── 📁 .github/                    # GitHub workflows and templates
│   └── workflows/
│       ├── ci.yml                 # Continuous Integration
│       ├── deploy.yml             # Deployment pipeline
│       └── test.yml               # Test automation
├── 📁 backend/                    # Node.js/Express API server
│   ├── src/                       # TypeScript source code
│   │   ├── __tests__/             # Backend tests
│   │   ├── middleware/            # Express middleware
│   │   ├── models/                # Database models
│   │   ├── routes/                # API route handlers
│   │   ├── services/              # Business logic
│   │   ├── types/                 # TypeScript definitions
│   │   ├── utils/                 # Utility functions
│   │   └── server.ts              # Main server file
│   ├── .env.example               # Environment template
│   ├── Dockerfile                 # Container configuration
│   ├── docker-compose.yml         # Multi-service setup
│   ├── package.json               # Backend dependencies
│   └── tsconfig.json              # TypeScript config
├── 📁 contracts/                  # Clarity smart contracts
│   ├── .clarinet/                 # Clarinet configuration
│   ├── settings/                  # Network settings
│   ├── tests/                     # Contract tests
│   ├── traits/                    # Contract traits
│   ├── *.clar                     # Smart contract files
│   └── Clarinet.toml              # Clarinet project config
├── 📁 src/                        # Next.js frontend application
│   ├── app/                       # App Router pages
│   │   ├── admin/                 # Admin dashboard
│   │   ├── passport/              # User passport
│   │   ├── public/                # Public pages
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Homepage
│   ├── components/                # React components
│   │   ├── forms/                 # Form components
│   │   └── *.tsx                  # UI components
│   └── lib/                       # Frontend utilities
├── 📁 tests/                      # Cross-cutting tests
│   ├── e2e/                       # End-to-end tests
│   ├── fixtures/                  # Test data
│   ├── integration/               # Integration tests
│   ├── performance/               # Load tests
│   └── unit/                      # Unit tests
├── 📁 docs/                       # Documentation
│   ├── api/                       # API documentation
│   ├── deployment/                # Deployment guides
│   └── development/               # Development guides
├── 📁 scripts/                    # Build and deployment scripts
│   ├── build.sh                   # Build script
│   ├── deploy.sh                  # Deployment script
│   └── setup.sh                   # Environment setup
├── .env.local.example             # Frontend environment template
├── .gitignore                     # Git ignore rules
├── package.json                   # Root package configuration
├── README.md                      # Project overview
└── PROJECT_STRUCTURE.md           # This file
```

## Component Breakdown

### 🎯 Frontend (`/src`)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Modular React components
- **State**: React hooks and context

### 🔧 Backend (`/backend`)
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Stacks signatures
- **API**: RESTful endpoints

### ⛓️ Smart Contracts (`/contracts`)
- **Language**: Clarity
- **Network**: Stacks blockchain
- **Tools**: Clarinet for development
- **Features**: NFT badges, communities, access control

### 🧪 Testing (`/tests`)
- **Unit**: Jest for component/function testing
- **Integration**: API and database testing
- **E2E**: Cypress for user flow testing
- **Performance**: K6 for load testing

### 📚 Documentation (`/docs`)
- **API**: OpenAPI/Swagger documentation
- **Deployment**: Infrastructure guides
- **Development**: Setup and contribution guides

### 🚀 DevOps (`.github`, `scripts`)
- **CI/CD**: GitHub Actions workflows
- **Deployment**: Docker and cloud deployment
- **Scripts**: Automation and build tools

## Development Workflow

### 1. Local Development
```bash
# Install dependencies
npm install

# Start development servers
npm run dev:all

# Run tests
npm test
```

### 2. Building
```bash
# Build all components
npm run build

# Build specific component
npm run build:frontend
npm run build:backend
npm run build:contracts
```

### 3. Testing
```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

### 4. Deployment
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## Configuration Files

### Root Level
- `package.json` - Workspace configuration and scripts
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.js` - Code linting rules
- `.prettierrc` - Code formatting rules

### Frontend Specific
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

### Backend Specific
- `backend/tsconfig.json` - Backend TypeScript config
- `backend/jest.config.js` - Backend testing config
- `backend/Dockerfile` - Container configuration

### Smart Contracts
- `contracts/Clarinet.toml` - Clarinet project configuration
- `contracts/settings/*.toml` - Network configurations

## Environment Management

### Development
- `.env.local.example` - Frontend environment template
- `backend/.env.example` - Backend environment template

### Production
- Environment variables managed through deployment platform
- Secrets stored securely (not in repository)

## Key Features

### 🔒 Security
- Environment variable management
- Input validation and sanitization
- Authentication and authorization
- Rate limiting and CORS

### 📊 Monitoring
- Health check endpoints
- Request/response logging
- Performance metrics
- Error tracking

### 🔄 Automation
- Automated testing on PR
- Continuous integration
- Automated deployment
- Code quality checks

### 📱 Responsive Design
- Mobile-first approach
- Progressive Web App features
- Cross-browser compatibility
- Accessibility compliance

## Getting Started

1. **Clone Repository**
   ```bash
   git clone https://github.com/DeborahOlaboye/PassportX.git
   cd PassportX
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment**
   ```bash
   cp .env.local.example .env.local
   cp backend/.env.example backend/.env
   # Update environment variables
   ```

4. **Start Development**
   ```bash
   npm run dev:all
   ```

5. **Run Tests**
   ```bash
   npm test
   ```

## Contributing

1. Follow the established folder structure
2. Add tests for new features
3. Update documentation
4. Follow code style guidelines
5. Submit pull requests for review