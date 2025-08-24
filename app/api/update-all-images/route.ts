import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { forceUpdate = false } = body // forceUpdate = true will update even if images exist

    console.log(`🖼️ Starting batch image update for all listings (forceUpdate: ${forceUpdate})`)
    
    const client = await pool.connect()
    
    try {
      // Get all listings that need image updates
      let listingsQuery = `
        SELECT id, ad_id, title, blocket_url, images 
        FROM listings 
        ORDER BY discovered_at DESC
      `
      
      if (!forceUpdate) {
        // Only get listings with placeholder images
        listingsQuery = `
          SELECT id, ad_id, title, blocket_url, images 
          FROM listings 
          WHERE images IS NULL 
             OR images = '[]'::jsonb 
             OR images::text LIKE '%data:image/svg+xml;base64%'
             OR images::text LIKE '%via.placeholder.com%'
          ORDER BY discovered_at DESC
        `
      }
      
      const listingsResult = await client.query(listingsQuery)
      const listings = listingsResult.rows
      
      console.log(`📊 Found ${listings.length} listings to update`)
      
      if (listings.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'No listings need image updates',
          updated: 0,
          skipped: 0
        })
      }
      
      let updated = 0
      let skipped = 0
      const results = []
      
      for (const listing of listings) {
        try {
          console.log(`🔄 Processing listing: ${listing.title} (ID: ${listing.id})`)
          
          // Check if we already have real images
          if (!forceUpdate && listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
            const hasRealImages = listing.images.some((img: any) => 
              img.url && !img.url.startsWith('data:image/svg+xml;base64') && !img.url.includes('via.placeholder.com')
            )
            
            if (hasRealImages) {
              console.log(`⏭️ Skipping ${listing.title} - already has real images`)
              skipped++
              continue
            }
          }
          
          // Create better images based on listing data
          const newImages = createImagesFromListing(listing)
          
          // Update the listing
          const updateQuery = `
            UPDATE listings 
            SET images = $1, updated_at = NOW()
            WHERE id = $2
          `
          await client.query(updateQuery, [JSON.stringify(newImages), listing.id])
          
          console.log(`✅ Updated images for: ${listing.title}`)
          updated++
          
          results.push({
            id: listing.id,
            title: listing.title,
            status: 'updated',
            images: newImages
          })
          
          // Small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (error) {
          console.error(`❌ Failed to update listing ${listing.id}:`, error)
          results.push({
            id: listing.id,
            title: listing.title,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      console.log(`🎉 Batch image update completed: ${updated} updated, ${skipped} skipped`)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Batch image update completed',
        summary: {
          total: listings.length,
          updated,
          skipped,
          failed: results.filter(r => r.status === 'failed').length
        },
        results
      })
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Failed to perform batch image update:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to perform batch image update',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to create images based on listing data
function createImagesFromListing(listing: any) {
  const title = listing.title || 'Annons'
  const encodedTitle = encodeURIComponent(title.substring(0, 30)) // Limit title length
  
  // Create multiple images with different sizes and colors
  const images = [
    {
      url: `https://via.placeholder.com/800x600/4f46e5/ffffff?text=${encodedTitle}`,
      description: `Huvudbild för ${title}`,
      thumbnail_url: `https://via.placeholder.com/400x300/4f46e5/ffffff?text=${encodedTitle}`
    },
    {
      url: `https://via.placeholder.com/600x450/10b981/ffffff?text=${encodedTitle}`,
      description: `Extra bild för ${title}`,
      thumbnail_url: `https://via.placeholder.com/300x225/10b981/ffffff?text=${encodedTitle}`
    }
  ]
  
  // Add more images for expensive items
  if (listing.price && listing.price > 1000) {
    images.push({
      url: `https://via.placeholder.com/700x500/f59e0b/ffffff?text=${encodedTitle}`,
      description: `Detaljbild för ${title}`,
      thumbnail_url: `https://via.placeholder.com/350x250/f59e0b/ffffff?text=${encodedTitle}`
    })
  }
  
  return images
}
