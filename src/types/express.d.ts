// Type definitions for Express request extensions

import { ApiKey } from '../generated/client'

declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKey
      serviceName?: string
      apiKeyPermissions?: string[]
    }
  }
}

export {}
