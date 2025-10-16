import { PrismaClient, User } from '@/generated/client'
import { Request, Response } from 'express'
import { verifyToken } from '@/utils/auth'

export interface GraphQLContext {
  prisma: PrismaClient
  req: Request
  res: Response
  user: User | null
}

export async function createContext({
  req,
  res,
}: {
  req: Request
  res: Response
}): Promise<GraphQLContext> {
  const prisma = new PrismaClient()
  
  // Get the user token from the headers
  const token = req.headers.authorization?.replace('Bearer ', '') || ''
  
  // Try to retrieve a user with the token
  const user = token ? await verifyToken(token, prisma) : null
  
  return { prisma, req, res, user }
}
