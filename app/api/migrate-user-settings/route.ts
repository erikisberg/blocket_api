import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Running user settings migration...')
    
    const client = await pool.connect()
    
    try {
      // First, remove any duplicate user_id entries if they exist
      const deleteQuery = `
        DELETE FROM user_settings 
        WHERE id NOT IN (
          SELECT DISTINCT ON (user_id) id
          FROM user_settings 
          ORDER BY user_id, created_at ASC
        )
      `
      await client.query(deleteQuery)
      console.log('✅ Removed duplicate user_id entries')
      
      // Add unique constraint
      const constraintQuery = `
        ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id)
      `
      await client.query(constraintQuery)
      console.log('✅ Added unique constraint on user_id')
      
      // Add comment
      const commentQuery = `
        COMMENT ON CONSTRAINT user_settings_user_id_unique ON user_settings IS 'Ensures each user can only have one settings record'
      `
      await client.query(commentQuery)
      console.log('✅ Added constraint comment')
      
      return NextResponse.json({ 
        success: true, 
        message: 'User settings migration completed successfully',
        changes: [
          'Removed duplicate user_id entries',
          'Added unique constraint on user_id',
          'Added constraint comment'
        ]
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ User settings migration failed:', error)
    
    // Check if constraint already exists
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ 
        success: true, 
        message: 'Constraint already exists, migration not needed',
        note: 'The unique constraint on user_id was already present'
      })
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
