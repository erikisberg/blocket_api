import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching monitoring logs and statistics...')

    const client = await pool.connect()

    try {
      // Test database connection
      await client.query('SELECT 1')
      console.log('✅ Database connection successful')

      // Check if listings table has required columns
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name IN ('price', 'ai_score', 'category', 'discovered_at')
      `)
      const availableColumns = columnCheck.rows.map(r => r.column_name)
      console.log('✅ Available columns:', availableColumns)

      // Get monitoring statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_listings,
          COUNT(CASE WHEN ai_score IS NOT NULL THEN 1 END) as analyzed_listings,
          COUNT(CASE WHEN ai_score >= 4 THEN 1 END) as high_score_listings,
          COUNT(CASE WHEN profit_analysis IS NOT NULL THEN 1 END) as profit_analyzed_listings,
          MIN(discovered_at) as first_discovery,
          MAX(discovered_at) as last_discovery
        FROM listings
      `
      let stats = null
      try {
        const statsResult = await client.query(statsQuery)
        stats = statsResult.rows[0]
        console.log('✅ Stats query completed')
      } catch (statsError) {
        console.error('❌ Stats query failed:', statsError)
        stats = {
          total_listings: 0,
          analyzed_listings: 0,
          high_score_listings: 0,
          profit_analyzed_listings: 0,
          first_discovery: null,
          last_discovery: null
        }
      }

      // Get recent discoveries by date
      let discoveries = []
      try {
        const discoveriesQuery = `
          SELECT 
            DATE(discovered_at) as discovery_date,
            COUNT(*) as new_listings,
            COUNT(CASE WHEN ai_score IS NOT NULL THEN 1 END) as analyzed_count,
            COUNT(CASE WHEN ai_score >= 4 THEN 1 END) as high_score_count
          FROM listings
          GROUP BY DATE(discovered_at)
          ORDER BY discovery_date DESC
          LIMIT 30
        `
        const discoveriesResult = await client.query(discoveriesQuery)
        discoveries = discoveriesResult.rows
        console.log('✅ Discoveries query completed')
      } catch (discoveriesError) {
        console.error('❌ Discoveries query failed:', discoveriesError)
        discoveries = []
      }

      // Get SMS notification history
      const smsQuery = `
        SELECT 
          sn.*,
          l.title,
          l.ai_score,
          l.price,
          l.currency
        FROM sms_notifications sn
        LEFT JOIN listings l ON sn.listing_id = l.id
        ORDER BY sn.created_at DESC
        LIMIT 50
      `
      let smsHistory = []
      try {
        const smsResult = await client.query(smsQuery)
        smsHistory = smsResult.rows
        console.log('✅ SMS query completed')
      } catch (smsError) {
        console.error('❌ SMS query failed:', smsError)
        smsHistory = []
      }

      // Get category distribution
      let categoryStats = []
      try {
        const categoryQuery = `
          SELECT 
            category,
            COUNT(*) as count,
            ROUND(AVG(price)) as avg_price,
            COUNT(CASE WHEN ai_score >= 4 THEN 1 END) as high_score_count
          FROM listings
          WHERE category IS NOT NULL
          GROUP BY category
          ORDER BY count DESC
        `
        const categoryResult = await client.query(categoryQuery)
        categoryStats = categoryResult.rows
        console.log('✅ Category query completed')
      } catch (categoryError) {
        console.error('❌ Category query failed:', categoryError)
        categoryStats = []
      }

      // Get price range distribution
      const priceQuery = `
        SELECT 
          price_range,
          COUNT(*) as count,
          COUNT(CASE WHEN ai_score >= 4 THEN 1 END) as high_score_count
        FROM (
          SELECT 
            CASE 
              WHEN price < 500 THEN '0-500 kr'
              WHEN price < 1000 THEN '500-1000 kr'
              WHEN price < 2000 THEN '1000-2000 kr'
              WHEN price < 5000 THEN '2000-5000 kr'
              ELSE '5000+ kr'
            END as price_range,
            ai_score
          FROM listings
        ) price_ranges
        GROUP BY price_range
        ORDER BY 
          CASE price_range
            WHEN '0-500 kr' THEN 1
            WHEN '500-1000 kr' THEN 2
            WHEN '1000-2000 kr' THEN 3
            WHEN '2000-5000 kr' THEN 4
            ELSE 5
          END
      `
      let priceStats = []
      try {
        const priceResult = await client.query(priceQuery)
        priceStats = priceResult.rows
        console.log('✅ Price query completed')
      } catch (priceError) {
        console.warn('⚠️ Price query failed, using fallback:', priceError)
        // Fallback: simple price count
        const fallbackPriceQuery = `
          SELECT 
            'Alla priser' as price_range,
            COUNT(*) as count,
            COUNT(CASE WHEN ai_score >= 4 THEN 1 END) as high_score_count
          FROM listings
        `
        const fallbackResult = await client.query(fallbackPriceQuery)
        priceStats = fallbackResult.rows
        console.log('✅ Fallback price query completed')
      }

      console.log('📊 Logs and statistics fetched successfully')

      return NextResponse.json({
        success: true,
        message: 'Monitoring logs and statistics fetched successfully',
        data: {
          stats,
          discoveries,
          smsHistory,
          categoryStats,
          priceStats
        }
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Failed to fetch monitoring logs:', error)

    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch monitoring logs',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
