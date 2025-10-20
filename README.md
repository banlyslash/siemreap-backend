# Siemreap Backend - Leave Request Management System

## Project Overview

The Leave Request Management System (LRMS) is a modern backend application designed to digitize and streamline the leave application and approval process in organizations. It replaces manual leave request workflows with an efficient digital system that connects employees, managers, and HR personnel through a transparent approval chain.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Database Management](#database-management)
- [GraphQL API](#graphql-api)
- [Build & Deployment](#build--deployment)
- [Code Quality & Standards](#code-quality--standards)
- [Default Users](#default-users)
- [License](#license)

## Features

- **User Management**: Role-based access control (Admin, HR, Manager, Employee)
- **Leave Requests**: Create, track, and manage leave applications
- **Approval Workflow**: Two-step approval process (Manager → HR)
- **Leave Types**: Support for various leave categories (Annual, Sick, Personal)
- **Leave Balances**: Automatic tracking of allocated and used leave days
- **Holiday Calendar**: Management of company holidays
- **HR Dashboard**: View pending approvals for follow-up and manager-approved requests

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **API**: GraphQL with Apollo Server
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT-based auth
- **Language**: TypeScript
- **Code Quality**: ESLint, Prettier
- **Git Hooks**: Husky, lint-staged
- **Documentation**: GraphQL Playground

## Project Structure

```
├── docs/                # Documentation files
│   └── leave-request-management-prd.md  # Product requirements
├── generated/           # Generated files
│   ├── prisma/          # Prisma client
│   └── graphql/         # GraphQL types
├── prisma/              # Prisma schema and migrations
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # REST API controllers
│   ├── graphql/         # GraphQL related files
│   │   ├── resolvers/   # GraphQL resolvers
│   │   └── schema/      # GraphQL schema definitions
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Domain models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env                 # Environment variables
├── .eslintrc.js        # ESLint configuration
├── .prettierrc         # Prettier configuration
├── codegen.ts          # GraphQL code generation config
└── tsconfig.json       # TypeScript configuration
```

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v14+)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd siemreap-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` (if it exists) or create a new `.env` file
   - Update the following variables:
     ```
     PORT=3001
     NODE_ENV=development
     API_PREFIX=/api
     JWT_SECRET="your-secret-key-for-development"
     DATABASE_URL="postgresql://username:password@localhost:5432/dbname?schema=public"
     ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```
   The server will be available at http://localhost:3001

2. Available development commands:
   - `npm run dev` - Start development server with hot reloading
   - `npm run lint` - Run ESLint to check code quality
   - `npm run lint:fix` - Fix ESLint issues automatically
   - `npm run format` - Format code with Prettier

## Database Management

1. Create and apply migrations:
   ```bash
   npm run prisma:migrate
   ```

2. Seed the database with initial data:
   ```bash
   npm run prisma:seed
   ```

3. Open Prisma Studio to view and edit data:
   ```bash
   npm run prisma:studio
   ```
   Prisma Studio will be available at http://localhost:5555

## GraphQL API

1. Generate TypeScript types from GraphQL schema:
   ```bash
   npm run codegen
   ```

2. Access GraphQL Playground:
   - Start the development server
   - Navigate to http://localhost:3001/api/graphql

## Build & Deployment

1. Build the application for production:
   ```bash
   npm run build
   ```
   This creates optimized JavaScript files in the `dist` directory.

2. Start the production server:
   ```bash
   npm run start
   ```

3. For deployment to production environments:
   - Set `NODE_ENV=production` in your environment
   - Use a process manager like PM2 or containerize with Docker
   - Set up proper database credentials and JWT secret

## Code Quality & Standards

This project uses several tools to maintain code quality:

- **ESLint**: JavaScript/TypeScript linting with Prisma plugin
  - Run: `npm run lint`

- **Prettier**: Code formatting for TS, GraphQL, and Prisma files
  - Run: `npm run format`

- **Husky**: Git hooks for pre-commit and pre-push
  - Pre-commit: Runs lint-staged to check code quality
  - Pre-push: Runs linting and build to ensure code integrity

- **TypeScript**: Strict type checking for better code quality

## Default Users

After seeding the database, you can log in with these users:

- **Admin**: admin@example.com / admin123
- **HR**: hr@example.com / hr123
- **Manager**: manager@example.com / manager123
- **Employee**: employee@example.com / employee123

## License

ISC
