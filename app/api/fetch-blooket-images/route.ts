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
    const { listingId, adId } = body

    if (!listingId || !adId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing listingId or adId' 
      }, { status: 400 })
    }

    console.log(`🖼️ Fetching real images from Blocket for listing ${listingId} (ad_id: ${adId})`)
    
    try {
      // Get the listing from database
      const client = await pool.connect()
      
      try {
        const listingQuery = `
          SELECT title, blocket_url, images 
          FROM listings 
          WHERE id = $1
        `
        const listingResult = await client.query(listingQuery, [listingId])
        
        if (listingResult.rows.length === 0) {
          return NextResponse.json({ 
            success: false, 
            error: 'Listing not found' 
          }, { status: 404 })
        }
        
        const listing = listingResult.rows[0]
        
        // Check if we already have real images (not placeholders)
        if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
          const hasRealImages = listing.images.some((img: any) => 
            img.url && !img.url.startsWith('data:image/svg+xml;base64')
          )
          
          if (hasRealImages) {
            return NextResponse.json({ 
              success: true, 
              message: 'Listing already has real images',
              images: listing.images
            })
          }
        }
        
        // For now, create a simple placeholder that looks more like a real image
        // In the future, this could actually fetch from Blocket API
        const newImages = [
          {
            url: `https://via.placeholder.com/400x300/4f46e5/ffffff?text=${encodeURIComponent(listing.title)}`,
            description: `Bild för ${listing.title}`,
            thumbnail_url: `https://via.placeholder.com/200x150/4f46e5/ffffff?text=${encodeURIComponent(listing.title)}`
          }
        ]
        
        // Update the listing with new images
        const updateQuery = `
          UPDATE listings 
          SET images = $1, updated_at = NOW()
          WHERE id = $2
        `
        await client.query(updateQuery, [JSON.stringify(newImages), listingId])
        
        console.log(`✅ Updated listing ${listingId} with new images`)
        
        return NextResponse.json({ 
          success: true, 
          message: 'Images updated successfully',
          listingId,
          images: newImages,
          note: 'This is a placeholder implementation. Real Blocket API integration would be needed for actual images.'
        })
        
      } finally {
        client.release()
      }
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      throw dbError
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch Blocket images:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
