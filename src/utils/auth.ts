import { PrismaClient, User } from '@/generated/client'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { GraphQLError } from 'graphql'

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * Generate JWT token for a user
 */
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

/**
 * Verify JWT token and return the user
 */
export async function verifyToken(
  token: string,
  prisma: PrismaClient
): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return await prisma.user.findUnique({ where: { id: decoded.userId } })
  } catch (error) {
    return null
  }
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Compare a password with a hash
 */
export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Authentication guard for resolvers
 */
export function requireAuth(user: User | null): void {
  if (!user) {
    throw new GraphQLError('You must be logged in', {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    })
  }
}

/**
 * Authorization guard for resolvers
 */
export function requireRole(user: User | null, roles: string[]): void {
  requireAuth(user)
  
  if (!user || !roles.includes(user.role)) {
    throw new GraphQLError('Not authorized', {
      extensions: {
        code: 'FORBIDDEN',
      },
    })
  }
}
