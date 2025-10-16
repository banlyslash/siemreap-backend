import http from 'http'
import app from './app'
import config from '@config/env'
import { logger } from '@utils/logger'

// Get HTTP server from app.ts
const httpServer = http.createServer(app)

// Start the server
httpServer.listen(config.port, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`)
  logger.info(`GraphQL endpoint: http://localhost:${config.port}${config.apiPrefix}/graphql`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...')
  logger.error(`${err.name}: ${err.message}`)
  httpServer.close(() => {
    process.exit(1)
  })
})

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully')
  httpServer.close(() => {
    logger.info('💥 Process terminated!')
  })
})
