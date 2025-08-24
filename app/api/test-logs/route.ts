import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection and basic queries...')

    const client = await pool.connect()

    try {
      // Test 1: Basic connection
      console.log('✅ Test 1: Testing basic connection...')
      await client.query('SELECT 1 as test')
      console.log('✅ Basic connection successful')

      // Test 2: Check if listings table exists
      console.log('✅ Test 2: Checking listings table...')
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'listings'
        )
      `)
      console.log('✅ Listings table exists:', tableCheck.rows[0].exists)

      // Test 3: Count total listings
      console.log('✅ Test 3: Counting total listings...')
      const countResult = await client.query('SELECT COUNT(*) as total FROM listings')
      console.log('✅ Total listings:', countResult.rows[0].total)

      // Test 4: Check table structure
      console.log('✅ Test 4: Checking table structure...')
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'listings'
        ORDER BY ordinal_position
      `)
      console.log('✅ Table structure:', structureResult.rows.map(r => `${r.column_name}: ${r.data_type}`))

      // Test 5: Simple price query
      console.log('✅ Test 5: Testing simple price query...')
      const priceTest = await client.query(`
        SELECT 
          COUNT(*) as total,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(price) as avg_price
        FROM listings
        WHERE price IS NOT NULL
      `)
      console.log('✅ Price statistics:', priceTest.rows[0])

      return NextResponse.json({
        success: true,
        message: 'All database tests passed successfully',
        results: {
          connection: '✅ OK',
          tableExists: tableCheck.rows[0].exists,
          totalListings: countResult.rows[0].total,
          columns: structureResult.rows.length,
          priceStats: priceTest.rows[0]
        }
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Database test failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
