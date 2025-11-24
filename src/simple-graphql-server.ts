import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { Request, Response } from 'express'
import { verifyToken } from '@/utils/auth'
import { verifyApiKey } from '@/utils/api-key-auth'
import { GraphQLContext } from '@/graphql/context'
import resolvers from '@/graphql/resolvers'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// Load GraphQL schema files
const schemaPath = path.join(__dirname, 'graphql/schema')
const typeDefs = fs
  .readdirSync(schemaPath)
  .filter(file => file.endsWith('.graphql'))
  .map(file => fs.readFileSync(path.join(schemaPath, file), { encoding: 'utf-8' }))

// We'll use the GraphQLContext interface from context.ts

async function startServer() {
  // Create Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
  })

  // Start the server
  const { url } = await startStandaloneServer(server, {
    context: async ({ req, res }) => {
      // Get the user token from the headers
      const token = req.headers.authorization?.replace('Bearer ', '') || ''
      
      // Get API key from header
      const apiKey = req.headers['x-api-key'] as string
      
      // Use singleton prisma instance
      
      // Try to authenticate with API key first
      let apiKeyAuth = null
      if (apiKey) {
        apiKeyAuth = await verifyApiKey(apiKey)
      }
      
      // If API key authentication failed or wasn't provided, try user token
      const user = !apiKeyAuth?.authenticated && token ? await verifyToken(token, prisma) : null
      
      // Determine if this is a service-to-service request
      const isServiceRequest = apiKeyAuth?.authenticated === true
      
      // Return the context with the required properties
      return { 
        prisma, 
        req: req as Request, 
        res: res as Response, 
        user,
        apiKeyAuth,
        isServiceRequest
      }
    },
    listen: { port: 4000 }
  })

  console.log(`🚀 Server ready at: ${url}`)
  
  return server
}

// Start the server
let apolloServer: ApolloServer<GraphQLContext> | null = null

startServer()
  .then(server => {
    apolloServer = server
  })
  .catch(err => {
    console.error('Error starting server:', err)
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...')
  
  if (apolloServer) {
    await apolloServer.stop()
  }
  
  await prisma.$disconnect()
  console.log('Server closed')
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server gracefully...')
  
  if (apolloServer) {
    await apolloServer.stop()
  }
  
  await prisma.$disconnect()
  console.log('Server closed')
  process.exit(0)
})
