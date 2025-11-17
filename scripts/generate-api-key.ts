import { PrismaClient } from '../src/generated/client'
import crypto from 'crypto'
import { logger } from '../src/utils/logger'

// This script generates an initial API key for testing purposes

async function generateApiKey() {
  const prisma = new PrismaClient()
  
  try {
    // Generate a random API key
    const key = crypto.randomBytes(32).toString('hex')
    
    // Create the API key in the database
    const apiKey = await (prisma as any).apiKey.create({
      data: {
        key,
        name: 'Initial API Key',
        serviceName: 'Test Service',
        description: 'Initial API key for testing',
        permissions: ['read:leaves', 'create:leaves'],
        active: true
      }
    })
    
    logger.info('API key created successfully:')
    logger.info(`ID: ${apiKey.id}`)
    logger.info(`Key: ${apiKey.key}`)
    logger.info(`Name: ${apiKey.name}`)
    logger.info(`Service: ${apiKey.serviceName}`)
    logger.info(`Permissions: ${apiKey.permissions.join(', ')}`)
    
    return apiKey
  } catch (error) {
    logger.error('Error creating API key:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
generateApiKey()
  .then(() => {
    logger.info('Done!')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('Script failed:', error)
    process.exit(1)
  })
