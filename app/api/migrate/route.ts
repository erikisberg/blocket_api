import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../components/database'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting JSON to database migration via API...')
    
    // Read JSON files
    const listingsPath = path.join(process.cwd(), 'bevakningar_listings.json')
    const statePath = path.join(process.cwd(), 'bevakningar_state.json')
    
    if (!fs.existsSync(listingsPath)) {
      return NextResponse.json({
        success: false,
        error: 'bevakningar_listings.json not found'
      }, { status: 404 })
    }
    
    if (!fs.existsSync(statePath)) {
      return NextResponse.json({
        success: false,
        error: 'bevakningar_state.json not found'
      }, { status: 404 })
    }
    
    const listingsData = JSON.parse(fs.readFileSync(listingsPath, 'utf8'))
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    
    // Extract listings from the nested structure and add type assertion
    const listings = Object.values(listingsData).flat() as any[]
    
    console.log(`📊 Found ${listings.length} listings and ${Object.keys(state).length} bevakningar`)
    
    let migratedCount = 0
    let skippedCount = 0
    let errors = []
    
    // Migrate bevakningar
    for (const [bevakningId, bevakningData] of Object.entries(state)) {
      try {
        const bevakning = bevakningData as { name?: string }
        await DatabaseService.createBevakning({
          bevakning_id: bevakningId,
          name: bevakning.name || 'Blocket Bevakning',
          user_id: 'default_user',
          is_active: true
        })
        console.log(`✅ Migrated bevakning: ${bevakningId}`)
      } catch (error) {
        if (error instanceof Error && error.message.includes('duplicate key')) {
          console.log(`⏭️  Bevakning ${bevakningId} already exists, skipping...`)
        } else {
          const errorMsg = `Failed to migrate bevakning ${bevakningId}: ${error}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }
    }
    
    // Migrate listings with AI analysis
    for (const listing of listings) {
      try {
        const dbListing = {
          bevakning_id: listing.bevakning_id || '11998349',
          ad_id: listing.ad.ad_id,
          title: listing.ad.subject,
          price: listing.ad.price.value,
          currency: listing.ad.price.suffix || 'kr',
          description: listing.ad.body,
          category: listing.ad.category?.[0]?.name || 'Unknown',
          condition: 'Unknown',
          location: listing.ad.location?.[0]?.name || 'Unknown',
          seller_type: listing.ad.advertiser?.type || 'Unknown',
          blocket_url: listing.ad.share_url || '',
          frontend_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://blocket-api.vercel.app'}/listing/${listing.ad.ad_id}`,
          discovered_at: new Date(listing.discovered_at),
          
          // AI analysis fields
          ai_score: listing.ai_analysis?.score || undefined,
          ai_confidence: listing.ai_analysis?.confidence || undefined,
          ai_reasoning: listing.ai_analysis?.reasoning || undefined,
          ai_factors: listing.ai_analysis?.factors || [],
          ai_recommendation: listing.ai_analysis?.recommendation || undefined,
          ai_analyzed_at: listing.ai_analysis?.analyzedAt ? new Date(listing.ai_analysis.analyzedAt) : undefined,
          ai_model: listing.ai_analysis?.model || undefined
        }
        
        await DatabaseService.createListing(dbListing)
        migratedCount++
        
        if (migratedCount % 10 === 0) {
          console.log(`📈 Migrated ${migratedCount} listings...`)
        }
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('duplicate key')) {
          skippedCount++
        } else {
          const errorMsg = `Failed to migrate listing ${listing.ad.ad_id}: ${error}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }
    }
    
    console.log(`\n🎉 Migration completed!`)
    console.log(`✅ Migrated: ${migratedCount} listings`)
    console.log(`⏭️  Skipped (duplicates): ${skippedCount} listings`)
    console.log(`📊 Total processed: ${listings.length} listings`)
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      results: {
        migrated: migratedCount,
        skipped: skippedCount,
        total: listings.length,
        errors: errors.length
      },
      errors: errors.slice(0, 10), // Return first 10 errors
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint to check migration status
export async function GET() {
  try {
    // Check if we have any data in the database
    const settings = await DatabaseService.getUserSettings('default_user')
    
    return NextResponse.json({
      success: true,
      message: 'Migration endpoint is ready',
      database_connected: true,
      has_user_settings: !!settings,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
