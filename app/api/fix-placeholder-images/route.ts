import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing placeholder images...')
    
    const client = await pool.connect()
    
    try {
      // Find listings with broken placeholder URLs
      const checkQuery = `
        SELECT COUNT(*) as total
        FROM listings 
        WHERE images::text LIKE '%via.placeholder.com%'
      `
      const checkResult = await client.query(checkQuery)
      const total = parseInt(checkResult.rows[0].total)
      
      if (total === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'No broken placeholder images found',
          stats: { total: 0, fixed: 0 }
        })
      }
      
      console.log(`📊 Found ${total} listings with broken placeholder images`)
      
      // Update broken placeholder images with working SVG
      const updateQuery = `
        UPDATE listings 
        SET images = '[{"url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYWEzYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIGltYWdlIGF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+", "description": "Ingen bild tillgänglig"}]',
        updated_at = NOW()
        WHERE images::text LIKE '%via.placeholder.com%'
      `
      
      const result = await client.query(updateQuery)
      const fixed = result.rowCount || 0
      
      console.log(`✅ Fixed ${fixed} broken placeholder images`)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Placeholder images fixed successfully',
        changes: [
          `Found ${total} listings with broken placeholder images`,
          `Fixed ${fixed} placeholder images with working SVG`
        ],
        stats: {
          total,
          fixed
        }
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Fix placeholder images failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
