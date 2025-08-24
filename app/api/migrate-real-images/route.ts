import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function POST(request: NextRequest) {
  try {
    console.log('🖼️ Starting migration of real Blocket images from JSON...')
    
    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'bevakningar_listings.json')
    
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'bevakningar_listings.json not found' 
      }, { status: 404 })
    }
    
    const jsonContent = fs.readFileSync(jsonPath, 'utf8')
    const jsonData = JSON.parse(jsonContent) as Record<string, any>
    
    console.log(`📊 Found ${Object.keys(jsonData).length} bevakningar in JSON`)
    
    const client = await pool.connect()
    
    try {
      let totalUpdated = 0
      let totalSkipped = 0
      const results = []
      
      // Process each bevakning
      for (const [bevakningId, bevakningData] of Object.entries(jsonData)) {
        const listings = bevakningData?.listings || []
        
        console.log(`🔄 Processing bevakning ${bevakningId} with ${listings.length} listings`)
        
        for (const listing of listings) {
          try {
            // Check if this listing exists in database
            const dbQuery = `
              SELECT id, ad_id, title, images 
              FROM listings 
              WHERE ad_id = $1
            `
            const dbResult = await client.query(dbQuery, [listing.ad.ad_id])
            
            if (dbResult.rows.length === 0) {
              console.log(`⏭️ Skipping listing ${listing.ad.ad_id} - not in database`)
              totalSkipped++
              continue
            }
            
            const dbListing = dbResult.rows[0]
            
            // Check if we already have real images
            if (dbListing.images && Array.isArray(dbListing.images) && dbListing.images.length > 0) {
              const hasRealImages = dbListing.images.some((img: any) => 
                img.url && img.url.includes('blocketcdn.se')
              )
              
              if (hasRealImages) {
                console.log(`⏭️ Skipping ${dbListing.title} - already has real images`)
                totalSkipped++
                continue
              }
            }
            
            // Convert Blocket images to our format
            if (listing.ad.images && listing.ad.images.length > 0) {
              const realImages = listing.ad.images.map((img: any) => ({
                url: img.url,
                description: `Bild för ${listing.ad.subject}`,
                thumbnail_url: img.url, // Use same URL for thumbnail
                width: img.width,
                height: img.height,
                type: img.type
              }))
              
              // Update database with real images
              const updateQuery = `
                UPDATE listings 
                SET images = $1, updated_at = NOW()
                WHERE id = $2
              `
              await client.query(updateQuery, [JSON.stringify(realImages), dbListing.id])
              
              console.log(`✅ Updated ${dbListing.title} with ${realImages.length} real images`)
              totalUpdated++
              
              results.push({
                id: dbListing.id,
                title: dbListing.title,
                ad_id: dbListing.ad_id,
                status: 'updated',
                imageCount: realImages.length,
                images: realImages
              })
            } else {
              console.log(`⚠️ No images found for ${dbListing.title}`)
              totalSkipped++
            }
            
          } catch (error) {
            console.error(`❌ Failed to process listing ${listing.ad.ad_id}:`, error)
            results.push({
              ad_id: listing.ad.ad_id,
              title: listing.ad.subject,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }
      
      console.log(`🎉 Migration completed: ${totalUpdated} updated, ${totalSkipped} skipped`)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Real images migration completed',
        summary: {
          totalUpdated,
          totalSkipped,
          totalProcessed: totalUpdated + totalSkipped
        },
        results
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Failed to migrate real images:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to migrate real images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
