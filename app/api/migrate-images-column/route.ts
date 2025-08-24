import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Adding images column to listings table...')
    
    const client = await pool.connect()
    
    try {
      // Add images column if it doesn't exist
      const addColumnQuery = `
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'
      `
      await client.query(addColumnQuery)
      console.log('✅ Added images column to listings table')
      
      // Create index for images column
      const createIndexQuery = `
        CREATE INDEX IF NOT EXISTS idx_listings_images ON listings USING GIN (images)
      `
      await client.query(createIndexQuery)
      console.log('✅ Created GIN index for images column')
      
      // Update existing rows to have empty images array if NULL
      const updateQuery = `
        UPDATE listings SET images = '[]' WHERE images IS NULL
      `
      const updateResult = await client.query(updateQuery)
      console.log(`✅ Updated ${updateResult.rowCount} existing listings with empty images array`)
      
      // Add comment to the column
      const commentQuery = `
        COMMENT ON COLUMN listings.images IS 'Array of image URLs and metadata from Blocket'
      `
      await client.query(commentQuery)
      console.log('✅ Added column comment')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Images column migration completed successfully',
        changes: [
          'Added images JSONB column to listings table',
          'Created GIN index for images column',
          `Updated ${updateResult.rowCount} existing listings`,
          'Added column comment'
        ]
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Images column migration failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
