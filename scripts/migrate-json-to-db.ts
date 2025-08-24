import { DatabaseService } from '../components/database'
import fs from 'fs'
import path from 'path'

async function migrateJSONToDatabase() {
  try {
    console.log('🚀 Starting JSON to database migration...')
    
    // Read JSON files
    const listingsPath = path.join(process.cwd(), 'bevakningar_listings.json')
    const statePath = path.join(process.cwd(), 'bevakningar_state.json')
    
    if (!fs.existsSync(listingsPath)) {
      console.error('❌ bevakningar_listings.json not found')
      return
    }
    
    if (!fs.existsSync(statePath)) {
      console.error('❌ bevakningar_state.json not found')
      return
    }
    
    const listings = JSON.parse(fs.readFileSync(listingsPath, 'utf8'))
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    
    console.log(`📊 Found ${listings.length} listings and ${Object.keys(state).length} bevakningar`)
    
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
          console.error(`❌ Failed to migrate bevakning ${bevakningId}:`, error)
        }
      }
    }
    
    // Migrate listings with AI analysis
    let migratedCount = 0
    let skippedCount = 0
    
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
          frontend_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/listing/${listing.ad.ad_id}`,
          discovered_at: new Date(listing.discovered_at),
          
          // AI analysis fields
          ai_score: listing.ai_analysis?.score || null,
          ai_confidence: listing.ai_analysis?.confidence || null,
          ai_reasoning: listing.ai_analysis?.reasoning || null,
          ai_factors: listing.ai_analysis?.factors || [],
          ai_recommendation: listing.ai_analysis?.recommendation || null,
          ai_analyzed_at: listing.ai_analysis?.analyzedAt ? new Date(listing.ai_analysis.analyzedAt) : null,
          ai_model: listing.ai_analysis?.model || null
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
          console.error(`❌ Failed to migrate listing ${listing.ad.ad_id}:`, error)
        }
      }
    }
    
    console.log(`\n🎉 Migration completed!`)
    console.log(`✅ Migrated: ${migratedCount} listings`)
    console.log(`⏭️  Skipped (duplicates): ${skippedCount} listings`)
    console.log(`📊 Total processed: ${listings.length} listings`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    process.exit(0)
  }
}

// Run migration
migrateJSONToDatabase()
