import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { SMSService } from '../../../components/sms-service'

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

const smsService = new SMSService()

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Starting daily summary generation...')

    const client = await pool.connect()

    try {
      // Get today's date
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]

      // Get all high-score listings (score 4-5) discovered today
      const highScoreQuery = `
        SELECT 
          id,
          title,
          price,
          currency,
          ai_score,
          ai_confidence,
          ai_reasoning,
          profit_analysis,
          blocket_url,
          category,
          location,
          discovered_at
        FROM listings
        WHERE ai_score >= 4
        AND DATE(discovered_at) = $1
        ORDER BY ai_score DESC, price ASC
      `
      
      const highScoreResult = await client.query(highScoreQuery, [todayString])
      const highScoreListings = highScoreResult.rows

      console.log(`📊 Found ${highScoreListings.length} high-score listings for today`)

      if (highScoreListings.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No high-score listings found for today',
          date: todayString,
          listings: []
        })
      }

      // Create comprehensive SMS message
      const smsMessage = createDailySummaryMessage(highScoreListings, todayString)

      // Send SMS
      const smsResult = await smsService.sendSMS({
        to: '+46768363183',
        from: process.env.FORTYSIXELK_SENDER || 'Blocket',
        message: smsMessage
      })

      if (smsResult.success) {
        console.log('✅ Daily summary SMS sent successfully')
        
        // Save SMS notification record
        await client.query(`
          INSERT INTO sms_notifications (listing_id, phone_number, message, status, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [
          'daily_summary',
          '+46768363183',
          smsMessage,
          'sent'
        ])

        return NextResponse.json({
          success: true,
          message: 'Daily summary SMS sent successfully',
          date: todayString,
          listingsCount: highScoreListings.length,
          smsResult
        })
      } else {
        throw new Error(`SMS sending failed: ${smsResult.error}`)
      }

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Daily summary failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Daily summary failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function createDailySummaryMessage(listings: any[], date: string): string {
  const totalListings = listings.length
  const score5Count = listings.filter(l => l.ai_score === 5).length
  const score4Count = listings.filter(l => l.ai_score === 4).length
  
  let message = `📊 DAGENS SAMMANFATTNING - ${date}\n\n`
  message += `🔍 Hittade ${totalListings} undervärderade objekt:\n`
  message += `🚨 ${score5Count} mycket undervärderade (5/5)\n`
  message += `💰 ${score4Count} undervärderade (4/5)\n\n`

  // Add top 3 listings with details
  const topListings = listings.slice(0, 3)
  message += `🏆 TOP 3 IDAG:\n\n`

  topListings.forEach((listing, index) => {
    const scoreEmoji = listing.ai_score === 5 ? '🚨' : '💰'
    const profit = listing.profit_analysis?.estimated_profit || 'Okänt'
    
    message += `${index + 1}. ${scoreEmoji} ${listing.title}\n`
    message += `   Pris: ${listing.price} ${listing.currency}\n`
    message += `   Score: ${listing.ai_score}/5\n`
    message += `   Vinst: ${profit} kr\n\n`
  })

  // Add summary stats
  const totalValue = listings.reduce((sum, l) => sum + l.price, 0)
  const avgPrice = Math.round(totalValue / totalListings)
  
  message += `📈 SAMMANFATTNING:\n`
  message += `Total värde: ${totalValue} kr\n`
  message += `Snittpris: ${avgPrice} kr\n`
  message += `Kategorier: ${Array.from(new Set(listings.map(l => l.category))).join(', ')}\n\n`
  
  message += `🔗 Se alla: https://blocket-api.vercel.app/\n`
  message += `📱 AI-analys körs automatiskt varje dag`

  return message
}

// GET method to show today's summary without sending SMS
export async function GET() {
  try {
    const client = await pool.connect()

    try {
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]

      const highScoreQuery = `
        SELECT 
          id,
          title,
          price,
          currency,
          ai_score,
          ai_confidence,
          ai_reasoning,
          profit_analysis,
          blocket_url,
          category,
          location,
          discovered_at
        FROM listings
        WHERE ai_score >= 4
        AND DATE(discovered_at) = $1
        ORDER BY ai_score DESC, price ASC
      `
      
      const highScoreResult = await client.query(highScoreQuery, [todayString])
      const highScoreListings = highScoreResult.rows

      return NextResponse.json({
        success: true,
        message: 'Today\'s high-score listings retrieved',
        date: todayString,
        listings: highScoreListings,
        summary: {
          total: highScoreListings.length,
          score5: highScoreListings.filter(l => l.ai_score === 5).length,
          score4: highScoreListings.filter(l => l.ai_score === 4).length,
          totalValue: highScoreListings.reduce((sum, l) => sum + l.price, 0),
          categories: Array.from(new Set(highScoreListings.map(l => l.category)))
        }
      })

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Failed to get daily summary:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to get daily summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
