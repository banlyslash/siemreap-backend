import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@/generated/client'
import { verifyToken } from '@/utils/auth'

import config from '@/config/env'
import routes from '@/routes/index'
import { errorHandler } from '@/middlewares/error.middleware'
import resolvers from '@graphql/resolvers'

// Create Express app
const app = express()
const httpServer = http.createServer(app)

// Apply common middlewares
app.use(helmet()) // Security headers
app.use(cors()) // Enable CORS
app.use(morgan('dev')) // HTTP request logger
app.use(express.json()) // Parse JSON bodies
app.use(express.urlencoded({ extended: true })) // Parse URL-encoded bodies

// Load GraphQL schema files
const schemaPath = path.join(__dirname, 'graphql/schema')
const typeDefs = fs
  .readdirSync(schemaPath)
  .filter(file => file.endsWith('.graphql'))
  .map(file => fs.readFileSync(path.join(schemaPath, file), { encoding: 'utf-8' }))

// Initialize Apollo Server
async function startApolloServer() {
  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: config.nodeEnv !== 'production',
  })

  // Start Apollo Server
  await server.start()

  // Apply Apollo middleware
  app.use(
    `${config.apiPrefix}/graphql`,
    cors<cors.CorsRequest>(),
    express.json(),
    // Use a type assertion to avoid TypeScript errors
    // This is necessary due to version mismatches between Apollo Server's Express types and our project's Express types
    (req, res, next) => {
      // Create a middleware wrapper that calls expressMiddleware
      expressMiddleware(server, {
        context: async ({ req, res }) => {
          // Get the user token from the headers
          const token = req.headers.authorization?.replace('Bearer ', '') || ''
          
          // Create a new PrismaClient instance
          const prisma = new PrismaClient()
          
          // Try to retrieve a user with the token
          const user = token ? await verifyToken(token, prisma) : null
          
          return { prisma, req, res, user }
        },
      })(req, res, next)
    }
  )
}

// Start Apollo Server
void startApolloServer()

// REST API routes
app.use(config.apiPrefix, routes)

// Error handling middleware
app.use(errorHandler)

export default app
