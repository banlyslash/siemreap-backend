import { User, PrismaClient } from '@/generated/client'
import { Request, Response } from 'express'
import { verifyToken } from '@/utils/auth'
import { verifyApiKey, ApiKeyAuthResult } from '@/utils/api-key-auth'
import prisma from '@/lib/prisma'

export interface GraphQLContext {
  prisma: PrismaClient
  req: Request
  res: Response
  user: User | null
  apiKeyAuth: ApiKeyAuthResult | null
  isServiceRequest: boolean
}

export async function createContext({
  req,
  res,
}: {
  req: Request
  res: Response
}): Promise<GraphQLContext> {
  // Use singleton prisma instance
  
  // Get the user token from the headers
  const token = req.headers.authorization?.replace('Bearer ', '') || ''
  
  // Get API key from header
  const apiKey = req.headers['x-api-key'] as string
  
  // Try to authenticate with API key first
  let apiKeyAuth: ApiKeyAuthResult | null = null
  if (apiKey) {
    apiKeyAuth = await verifyApiKey(apiKey)
  }
  
  // If API key authentication failed or wasn't provided, try user token
  const user = !apiKeyAuth?.authenticated && token ? await verifyToken(token, prisma) : null
  
  // Determine if this is a service-to-service request
  const isServiceRequest = apiKeyAuth?.authenticated === true
  
  return { 
    prisma, 
    req, 
    res, 
    user, 
    apiKeyAuth, 
    isServiceRequest 
  }
}
