# Development Commands

## Testing
```bash
npm run test
npm run test -- tests/integration/community-creation.test.ts
npm run test:watch
```

## Linting & Type Checking
```bash
npm run lint
npm run typecheck
```

## Building
```bash
npm run build
```

## Frontend Development
```bash
npm run dev
```

## Backend Development
```bash
cd backend
npm run dev
```

## Git Workflow
```bash
# Create feature branch
git checkout -b feat/[issue-number]-[description]

# Make commits (aim for 15+ commits per feature)
git add .
git commit -m "[type]: [description]"

# Push to remote
git push origin [branch-name] -u

# Create pull request on GitHub
```

## Recent Features Implemented

### Issue #80: Community Creation with WalletConnect
- Community creation form with validation
- Contract interactions via community-manager.clar
- STX payment handling and post-conditions
- Backend transaction service with approval workflow
- API endpoints for community management
- Comprehensive testing and documentation

## Environment Setup
See `docs/COMMUNITY_CREATION_SETUP.md` for detailed setup instructions.

## Available NPM Scripts
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run build` - Build production bundle
- `npm run dev` - Start development server
