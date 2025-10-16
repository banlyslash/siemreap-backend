import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

interface Config {
  port: number
  nodeEnv: string
  apiPrefix: string
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api',
}

export default config
