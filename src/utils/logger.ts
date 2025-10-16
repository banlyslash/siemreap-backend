import config from '../config/env'

/**
 * Custom logger utility with different log levels
 */
export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    if (config.nodeEnv !== 'test') {
      console.info(`[INFO] ${message}`, ...args)
    }
  },
  
  warn: (message: string, ...args: unknown[]): void => {
    if (config.nodeEnv !== 'test') {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },
  
  error: (message: string, ...args: unknown[]): void => {
    if (config.nodeEnv !== 'test') {
      console.error(`[ERROR] ${message}`, ...args)
    }
  },
  
  debug: (message: string, ...args: unknown[]): void => {
    if (config.nodeEnv === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }
}
