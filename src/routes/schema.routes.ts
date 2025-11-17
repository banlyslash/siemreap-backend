import { Router, Request, Response } from 'express'
import path from 'path'
import fs from 'fs'

const router = Router()

/**
 * GET /api/schema
 * Returns the compiled GraphQL schema file
 * This endpoint makes it easy for frontend developers to fetch the latest schema
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.join(__dirname, '../graphql/schema/compiled-schema.graphql')
    
    // Check if file exists
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({
        error: 'Schema file not found',
        message: 'Please run "npm run compile-schema" to generate the schema file'
      })
    }

    // Read and send the schema file
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Disposition', 'inline; filename="schema.graphql"')
    
    res.send(schema)
  } catch (error) {
    console.error('Error serving schema:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to read schema file'
    })
  }
})

/**
 * GET /api/schema/download
 * Downloads the compiled GraphQL schema file
 */
router.get('/download', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.join(__dirname, '../graphql/schema/compiled-schema.graphql')
    
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({
        error: 'Schema file not found',
        message: 'Please run "npm run compile-schema" to generate the schema file'
      })
    }

    // Send as downloadable file
    res.download(schemaPath, 'schema.graphql', (err) => {
      if (err) {
        console.error('Error downloading schema:', err)
        res.status(500).json({
          error: 'Download failed',
          message: 'Failed to download schema file'
        })
      }
    })
  } catch (error) {
    console.error('Error serving schema download:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to download schema file'
    })
  }
})

/**
 * GET /api/schema/info
 * Returns metadata about the schema
 */
router.get('/info', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.join(__dirname, '../graphql/schema/compiled-schema.graphql')
    
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({
        error: 'Schema file not found',
        message: 'Please run "npm run compile-schema" to generate the schema file'
      })
    }

    const stats = fs.statSync(schemaPath)
    const content = fs.readFileSync(schemaPath, 'utf-8')
    const lines = content.split('\n')
    
    // Extract generation timestamp from header
    const timestampLine = lines.find(line => line.includes('Generated:'))
    const timestamp = timestampLine ? timestampLine.split('Generated:')[1]?.trim() || 'Unknown' : 'Unknown'

    res.json({
      file: 'compiled-schema.graphql',
      path: '/api/schema',
      downloadUrl: '/api/schema/download',
      size: {
        bytes: stats.size,
        kilobytes: (stats.size / 1024).toFixed(2),
      },
      lines: lines.length,
      lastModified: stats.mtime,
      generated: timestamp,
      endpoints: {
        view: '/api/schema',
        download: '/api/schema/download',
        info: '/api/schema/info',
      }
    })
  } catch (error) {
    console.error('Error getting schema info:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get schema information'
    })
  }
})

export default router
