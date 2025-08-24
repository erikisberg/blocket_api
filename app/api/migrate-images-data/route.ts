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
    console.log('🖼️ Starting image data migration...')
    
    const client = await pool.connect()
    
    try {
      // First, check if we have any listings without images
      const checkQuery = `
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN images = '[]' OR images IS NULL THEN 1 END) as empty_images
        FROM listings
      `
      const checkResult = await client.query(checkQuery)
      const { total, empty_images } = checkResult.rows[0]
      
      console.log(`📊 Found ${total} total listings, ${empty_images} with empty images`)
      
      if (empty_images === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'All listings already have images data',
          stats: { total, empty_images }
        })
      }
      
      // Try to read from JSON file if it exists
      let jsonData = null
      try {
        const jsonPath = path.join(process.cwd(), 'bevakningar_listings.json')
        if (fs.existsSync(jsonPath)) {
          const jsonContent = fs.readFileSync(jsonPath, 'utf8')
          jsonData = JSON.parse(jsonContent)
          console.log(`📁 Found JSON file with ${jsonData.length} listings`)
        }
      } catch (fileError) {
        console.log('📁 No JSON file found or error reading it')
      }
      
      let updatedCount = 0
      
      if (jsonData && Array.isArray(jsonData)) {
        // Migrate from JSON file
        console.log('🔄 Migrating images from JSON file...')
        
        for (const listing of jsonData) {
          if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
            try {
              const updateQuery = `
                UPDATE listings 
                SET images = $1, updated_at = NOW()
                WHERE ad_id = $2
              `
              const values = [JSON.stringify(listing.images), listing.ad_id]
              const result = await client.query(updateQuery, values)
              
              if (result.rowCount && result.rowCount > 0) {
                updatedCount++
                console.log(`✅ Updated images for listing: ${listing.ad_id}`)
              }
            } catch (updateError) {
              console.warn(`⚠️ Failed to update images for listing ${listing.ad_id}:`, updateError)
            }
          }
        }
        
        console.log(`✅ Migrated images for ${updatedCount} listings from JSON file`)
      } else {
        // No JSON data, create placeholder images structure
        console.log('🔄 Creating placeholder images structure...')
        
        const updateQuery = `
          UPDATE listings 
          SET images = '[{"url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYWEzYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIGltYWdlIGF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+", "description": "Ingen bild tillgänglig"}]',
          updated_at = NOW()
          WHERE images = '[]' OR images IS NULL
        `
        const result = await client.query(updateQuery)
        updatedCount = result.rowCount || 0
        
        console.log(`✅ Created placeholder images for ${updatedCount} listings`)
      }
      
      // Verify the update
      const verifyQuery = `
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN images != '[]' AND images IS NOT NULL THEN 1 END) as with_images
        FROM listings
      `
      const verifyResult = await client.query(verifyQuery)
      const { total: finalTotal, with_images } = verifyResult.rows[0]
      
      return NextResponse.json({ 
        success: true, 
        message: 'Image data migration completed successfully',
        changes: [
          `Updated ${updatedCount} listings with image data`,
          `Total listings: ${finalTotal}`,
          `Listings with images: ${with_images}`,
          `Listings without images: ${finalTotal - with_images}`
        ],
        stats: {
          total: finalTotal,
          with_images,
          without_images: finalTotal - with_images,
          updated: updatedCount
        }
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Image data migration failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
