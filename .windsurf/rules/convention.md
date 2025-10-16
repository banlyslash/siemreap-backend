---
trigger: manual
---

# Siemreap Backend - Code Conventions

This document outlines the coding standards, naming conventions, folder structure rules, and testing requirements for the Siemreap Backend project. All contributors should adhere to these guidelines to maintain consistency and code quality.

## Table of Contents

- [Coding Standards](#coding-standards)
- [Naming Conventions](#naming-conventions)
- [Folder Structure](#folder-structure)
- [Testing Requirements](#testing-requirements)
- [Git Workflow](#git-workflow)

## Coding Standards

### TypeScript

- Use TypeScript for all code files
- Enable strict mode and follow TypeScript best practices
- Explicitly define return types for functions (except in GraphQL resolvers)
- Avoid using `any` type when possible
- Use optional chaining (`?.`) and nullish coalescing (`??`) operators
- Use type inference where it makes code more readable

### ESLint Rules

- Follow the ESLint configuration defined in `.eslintrc.js`
- Key rules include:
  - Explicit function return types required (except in GraphQL resolvers)
  - No unused variables (prefix unused parameters with `_`)
  - Limited use of `console` statements (only `warn`, `error`, `info`, `debug`)
  - Prefer `const` over `let` when variable is not reassigned
  - Follow Prisma best practices (field defaults, unique constraints)

### Formatting

- Use Prettier for code formatting
- Configuration settings:
  - No semicolons
  - Single quotes
  - Trailing commas in all multiline constructs
  - 80 character line width
  - 2 spaces for indentation
  - Arrow function parentheses avoided when possible
  - LF line endings
  - Bracket spacing enabled

### Comments and Documentation

- Use JSDoc style comments for functions, classes, and interfaces
- Include a brief description for each function
- Document parameters and return types
- Add inline comments for complex logic
- Keep comments up to date with code changes

### Imports

- Use path aliases for cleaner imports (e.g., `@utils/auth` instead of `../../utils/auth`)
- Group imports in the following order:
  1. External libraries
  2. Internal modules
  3. Type imports
- Sort imports alphabetically within each group
- Avoid default exports; use named exports for better refactoring support

## Naming Conventions

### Files and Directories

- Use kebab-case for file and directory names (e.g., `leave-request.service.ts`)
- Use descriptive suffixes to indicate file type:
  - `.controller.ts` for controllers
  - `.service.ts` for services
  - `.middleware.ts` for middlewares
  - `.model.ts` for models
  - `.interface.ts` or `.type.ts` for type definitions
  - `.util.ts` for utility functions
  - `.resolver.ts` for GraphQL resolvers
  - `.graphql` for GraphQL schema files

### Variables and Functions

- Use camelCase for variables, function names, and method names
- Use PascalCase for classes, interfaces, types, and enums
- Use descriptive names that indicate purpose
- Boolean variables should be prefixed with `is`, `has`, or `should`
- Functions should use verbs that describe their action
- Avoid abbreviations unless they are well-known

### Constants

- Use UPPER_SNAKE_CASE for global constants
- Use PascalCase for enum values
- Place constants at the top of the file or in a dedicated constants file

### GraphQL

- Use PascalCase for type names, interfaces, and input types
- Use camelCase for field names, arguments, and queries/mutations
- Use descriptive names for queries and mutations that indicate their purpose

### Database

- Use singular form for model names in Prisma schema
- Use camelCase for field names
- Use descriptive names for relations
- Add comments to explain complex relationships or constraints

## Folder Structure

### Root Structure

```
├── docs/                # Documentation files
├── generated/           # Generated files (Prisma client, GraphQL types)
├── prisma/              # Prisma schema and migrations
├── src/                 # Source code
├── tests/               # Test files (to be added)
├── .env                 # Environment variables
├── .eslintrc.js         # ESLint configuration
├── .prettierrc          # Prettier configuration
├── codegen.ts           # GraphQL code generation config
└── tsconfig.json        # TypeScript configuration
```

### Source Code Structure

```
src/
├── config/              # Configuration files
├── controllers/         # REST API controllers
├── graphql/             # GraphQL related files
│   ├── resolvers/       # GraphQL resolvers
│   └── schema/          # GraphQL schema definitions
├── middlewares/         # Express middlewares
├── models/              # Domain models
├── routes/              # API routes
├── services/            # Business logic
├── utils/               # Utility functions
├── app.ts               # Express app setup
└── server.ts            # Server entry point
```

### Rules for Adding New Files

1. Place files in the appropriate directory based on their function
2. Follow the naming conventions outlined above
3. Create new subdirectories when logical grouping is needed
4. Keep files focused on a single responsibility
5. Don't create deeply nested directory structures (max 3 levels)

## Testing Requirements

### Test Framework

- Jest should be used as the testing framework (to be implemented)
- Tests should be co-located with the code they test in a `__tests__` directory

### Test Coverage

- Aim for at least 80% code coverage
- Critical paths should have 100% coverage
- Write tests for:
  - Services
  - Controllers
  - Resolvers
  - Utilities
  - Middlewares

### Test Types

1. **Unit Tests**
   - Test individual functions and methods in isolation
   - Mock dependencies and external services
   - Focus on testing business logic

2. **Integration Tests**
   - Test interactions between components
   - Test database operations with a test database
   - Test GraphQL resolvers with a test server

3. **E2E Tests**
   - Test complete user flows
   - Use a separate test database
   - Focus on critical paths

### Test Naming

- Use descriptive test names that explain what is being tested
- Follow the pattern: `describe('ComponentName', () => { it('should do something', () => {}) })`
- Group related tests using nested `describe` blocks

### Test Data

- Use factories or fixtures for test data
- Don't rely on existing data in the database
- Clean up test data after tests run

## Git Workflow

### Commits

- Write clear, concise commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issue numbers in commit messages when applicable

### Branches

- Use feature branches for new features
- Use fix branches for bug fixes
- Use the format: `feature/feature-name` or `fix/bug-name`

### Pull Requests

- Create descriptive pull request titles
- Include a summary of changes
- Reference related issues
- Ensure all tests pass before merging
- Require code review before merging

### Pre-commit Hooks

- ESLint and Prettier are run on staged files
- Tests will be run on pre-push (when implemented)
- Build must succeed before pushing
