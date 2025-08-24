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
      const statsResult = await client.query(statsQuery)
      const stats = statsResult.rows[0]
      console.log('✅ Stats query completed')

      // Get recent discoveries by date
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
      const discoveries = discoveriesResult.rows
      console.log('✅ Discoveries query completed')

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
      const smsResult = await client.query(smsQuery)
      const smsHistory = smsResult.rows
      console.log('✅ SMS query completed')

      // Get category distribution
      const categoryQuery = `
        SELECT 
          category,
          COUNT(*) as count,
          AVG(price) as avg_price,
          COUNT(CASE WHEN ai_score >= 4 THEN 1 END) as high_score_count
        FROM listings
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
      `
      const categoryResult = await client.query(categoryQuery)
      const categoryStats = categoryResult.rows
      console.log('✅ Category query completed')

      // Get price range distribution
      const priceQuery = `
        SELECT 
          CASE 
            WHEN price < 500 THEN '0-500 kr'
            WHEN price < 1000 THEN '500-1000 kr'
            WHEN price < 2000 THEN '1000-2000 kr'
            WHEN price < 5000 THEN '2000-5000 kr'
            ELSE '5000+ kr'
          END as price_range,
          COUNT(*) as count,
          COUNT(CASE WHEN ai_score >= 4 THEN 1 END) as high_score_count
        FROM listings
        GROUP BY 
          CASE 
            WHEN price < 500 THEN '0-500 kr'
            WHEN price < 1000 THEN '500-1000 kr'
            WHEN price < 2000 THEN '1000-2000 kr'
            WHEN price < 5000 THEN '2000-5000 kr'
            ELSE '5000+ kr'
          END
        ORDER BY 
          CASE 
            WHEN price < 500 THEN 1
            WHEN price < 1000 THEN 2
            WHEN price < 2000 THEN 3
            WHEN price < 5000 THEN 4
            ELSE 5
          END
      `
      const priceResult = await client.query(priceQuery)
      const priceStats = priceResult.rows
      console.log('✅ Price query completed')

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
