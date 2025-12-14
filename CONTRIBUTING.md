# Contributing to PassportX

Thank you for your interest in contributing to PassportX! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Code of Conduct

We are committed to fostering a welcoming and inclusive community. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Docker and Docker Compose (recommended)
- Git
- Clarinet (for smart contract development)

### Initial Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/PassportX.git
   cd PassportX
   ```

3. Run the setup script:
   ```bash
   make setup
   # or
   bash scripts/setup-dev.sh
   ```

4. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Project Locally

**Using Docker (Recommended):**
```bash
make docker-up
```

**Manual Setup:**
```bash
# Start backend
cd backend
npm run dev

# In another terminal, start frontend
npm run dev
```

### Available Commands

See all available commands:
```bash
make help
```

Common commands:
- `make dev` - Start development servers
- `make test` - Run all tests
- `make lint` - Run linters
- `make format` - Format code
- `make build` - Build the project

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Properly type all functions and variables
- Avoid `any` types when possible

### Code Style

- Use Prettier for formatting (run `make format`)
- Follow ESLint rules (run `make lint`)
- Use meaningful variable and function names
- Write self-documenting code with clear comments for complex logic

### File Organization

- Place components in `src/components/`
- Place API routes in `backend/src/routes/`
- Place business logic in `backend/src/services/`
- Place database models in `backend/src/models/`
- Place utilities in `src/lib/` or `backend/src/utils/`

## Testing Guidelines

### Test Requirements

All new features must include tests:

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test API endpoints and services
3. **Smart Contract Tests** - Test Clarity contracts with Clarinet

### Writing Tests

**Backend Tests:**
```typescript
describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = functionUnderTest(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

**Smart Contract Tests:**
```clarity
(define-test test-name
  (begin
    ;; Setup
    (contract-call? .contract function-name param)

    ;; Assert
    (asserts! (is-eq result expected) (err u1))
  )
)
```

### Running Tests

```bash
# All tests
make test

# Specific test suites
make test-unit
make test-contracts
make test-e2e

# With coverage
make test-coverage
```

## Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
feat(community): add member management endpoints
fix(badges): resolve issuance validation error
docs: update README with setup instructions
test(api): add integration tests for user service
```

### Commit Message Validation

Commit messages are automatically validated by the pre-commit hook. Invalid formats will be rejected.

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `make test`
2. Run linters: `make lint`
3. Format code: `make format`
4. Update documentation if needed
5. Add tests for new features
6. Rebase on latest main branch

### PR Guidelines

1. **Title**: Use conventional commit format
   ```
   feat(scope): brief description
   ```

2. **Description**: Include:
   - What changes were made and why
   - Related issue numbers (e.g., "Fixes #123")
   - Screenshots for UI changes
   - Breaking changes (if any)

3. **Size**: Keep PRs focused and reasonably sized
   - Prefer smaller, incremental PRs
   - Split large features into multiple PRs

4. **Review**: Address all review comments
   - Make requested changes
   - Respond to questions
   - Update based on feedback

### PR Template

```markdown
## Description
Brief description of changes

## Related Issues
Fixes #(issue number)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

## Project Structure

```
PassportX/
├── backend/              # Backend API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── utils/        # Helper functions
│   │   └── __tests__/    # Backend tests
│   └── package.json
├── src/                  # Frontend (Next.js)
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── lib/             # Frontend utilities
│   └── types/           # TypeScript types
├── contracts/           # Smart contracts (Clarity)
├── tests/              # E2E and integration tests
├── scripts/            # Development scripts
└── .github/            # GitHub workflows
```

## Additional Resources

- [Backend API Documentation](backend/API_DOCUMENTATION.md)
- [Frontend Setup Guide](FRONTEND_SETUP.md)
- [Project Structure](PROJECT_STRUCTURE.md)
- [Deployment Guide](backend/DEPLOYMENT.md)

## Getting Help

- **Issues**: Check existing [GitHub Issues](https://github.com/DeborahOlaboye/PassportX/issues)
- **Discussions**: Start a [GitHub Discussion](https://github.com/DeborahOlaboye/PassportX/discussions)
- **Documentation**: Review project documentation files

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to PassportX! 🎉
