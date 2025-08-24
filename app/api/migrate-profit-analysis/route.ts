import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Adding profit_analysis field to listings table...')
    
    const client = await pool.connect()
    
    try {
      // Add the profit_analysis column as JSONB
      const addColumnQuery = `
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS profit_analysis JSONB
      `
      await client.query(addColumnQuery)
      console.log('✅ Added profit_analysis column to listings table')
      
      // Create an index for efficient querying of profit analysis data
      const createIndexQuery = `
        CREATE INDEX IF NOT EXISTS idx_listings_profit_analysis ON listings USING GIN (profit_analysis)
      `
      await client.query(createIndexQuery)
      console.log('✅ Created GIN index for profit_analysis column')
      
      // Add comment to document the field
      const commentQuery = `
        COMMENT ON COLUMN listings.profit_analysis IS 'Detailed profit analysis from AI including repair costs, estimated profit, risk level, etc.'
      `
      await client.query(commentQuery)
      console.log('✅ Added column comment')
      
      // Update existing rows to have NULL profit_analysis
      const updateQuery = `
        UPDATE listings SET profit_analysis = NULL WHERE profit_analysis IS NULL
      `
      const result = await client.query(updateQuery)
      console.log(`✅ Updated ${result.rowCount || 0} existing listings with NULL profit_analysis`)
      
      // Verify the column was added
      const verifyQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'listings' AND column_name = 'profit_analysis'
      `
      const verifyResult = await client.query(verifyQuery)
      
      if (verifyResult.rows.length === 0) {
        throw new Error('profit_analysis column was not created successfully')
      }
      
      const columnInfo = verifyResult.rows[0]
      console.log(`✅ Column verified: ${columnInfo.column_name} (${columnInfo.data_type}, nullable: ${columnInfo.is_nullable})`)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Profit analysis migration completed successfully',
        changes: [
          'Added profit_analysis JSONB column to listings table',
          'Created GIN index for profit_analysis column',
          'Added column comment',
          `Updated ${result.rowCount || 0} existing listings`
        ],
        columnInfo: {
          name: columnInfo.column_name,
          type: columnInfo.data_type,
          nullable: columnInfo.is_nullable
        }
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Profit analysis migration failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
