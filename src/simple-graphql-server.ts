import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@/generated/client'
import { verifyToken } from '@/utils/auth'
import resolvers from '@/graphql/resolvers'
import { GraphQLContext } from '@/graphql/context'
import { Request, Response } from 'express'

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
      
      // Create a new PrismaClient instance
      const prisma = new PrismaClient()
      
      // Try to retrieve a user with the token
      const user = token ? await verifyToken(token, prisma) : null
      
      // Return the context with the required properties
      return { prisma, req: req as Request, res: res as Response, user }
    },
    listen: { port: 4000 }
  })

  console.log(`🚀 Server ready at: ${url}`)
}

startServer().catch(err => {
  console.error('Error starting server:', err)
})
